import type { User } from '@/types/user'
import { refreshSession } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'

vi.mock('@/api/auth', () => ({
  createAuthentication: vi.fn(),
  refreshSession: vi.fn(),
  revokeSessions: vi.fn(),
}))

const user: User = {
  id: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  fullName: 'Ada Lovelace',
  configs: {},
}

function refreshSucceeds() {
  vi.mocked(refreshSession).mockResolvedValue({
    status: 'success',
    type: 'object',
    data: { token: 'jwt', user },
  })
}

function refreshFails() {
  vi.mocked(refreshSession).mockRejectedValue(new Error('no session'))
}

beforeEach(async () => {
  setActivePinia(createPinia())
  refreshFails()
  await router.push('/__reset')
  vi.mocked(refreshSession).mockClear()
})

describe('router guards', () => {
  it('redirects guests from protected routes to sign in with the original path', async () => {
    await router.push('/users/profile?tab=email')

    expect(router.currentRoute.value.name).toBe('signIn')
    expect(router.currentRoute.value.query.redirect).toBe('/users/profile?tab=email')
  })

  it('restores the session from the refresh cookie before checking auth', async () => {
    refreshSucceeds()

    await router.push('/users/profile')

    expect(refreshSession).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.name).toBe('profile')
    expect(useAuthStore().token).toBe('jwt')
  })

  it('does not try to restore the session when already authenticated', async () => {
    useAuthStore().setToken('jwt')

    await router.push('/')

    expect(refreshSession).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('redirects authenticated users away from guest-only routes', async () => {
    useAuthStore().setToken('jwt')

    await router.push('/users/sign-up')

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('lets guests open guest-only routes', async () => {
    await router.push('/users/sign-up')

    expect(router.currentRoute.value.name).toBe('signUp')
  })

  it('lets anyone open public routes', async () => {
    await router.push('/users/confirmation')

    expect(router.currentRoute.value.name).toBe('confirmEmail')
  })

  it('clears the current notification on navigation', async () => {
    const notificationStore = useNotificationStore()
    notificationStore.setCurrentMessage('Saved!')

    await router.push('/users/confirmation')

    expect(notificationStore.currentMessage).toBe('')
  })
})
