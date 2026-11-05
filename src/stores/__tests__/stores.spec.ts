import type { User } from '@/types/user'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { refreshSession, revokeSessions } from '@/api/auth'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/auth', () => ({
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

beforeEach(() => {
  localStorage.clear()
  vi.mocked(refreshSession).mockReset()
  vi.mocked(revokeSessions).mockReset()
  setActivePinia(createPinia())
})

describe('auth store', () => {
  it('is authenticated only when a token is set', () => {
    const store = useAuthStore()

    expect(store.isAuthenticated).toBe(false)

    store.setToken('jwt')

    expect(store.isAuthenticated).toBe(true)
  })

  it('reads rememberMe from localStorage on creation', () => {
    localStorage.setItem('rememberMe', 'true')

    expect(useAuthStore().rememberMe).toBe(true)
  })

  it('persists rememberMe and removes the key when disabled', () => {
    const store = useAuthStore()

    store.setRememberMe(true)
    expect(localStorage.getItem('rememberMe')).toBe('true')

    store.setRememberMe(false)
    expect(localStorage.getItem('rememberMe')).toBeNull()
  })

  it('clears token, rememberMe and user on clearSession', () => {
    const store = useAuthStore()
    const userStore = useUserStore()

    store.setToken('jwt')
    store.setRememberMe(true)
    userStore.setUser(user)

    store.clearSession()

    expect(store.token).toBeNull()
    expect(store.rememberMe).toBe(false)
    expect(localStorage.getItem('rememberMe')).toBeNull()
    expect(userStore.user).toBeNull()
  })

  it('refreshes token and user using the rememberMe preference', async () => {
    vi.mocked(refreshSession).mockResolvedValue({
      status: 'success',
      type: 'object',
      data: { token: 'new-jwt', user },
    })
    const store = useAuthStore()

    store.setRememberMe(true)
    await store.refreshToken()

    expect(refreshSession).toHaveBeenCalledWith({ rememberMe: true })
    expect(store.token).toBe('new-jwt')
    expect(useUserStore().user).toEqual(user)
  })

  it('logout revokes sessions and clears local state', async () => {
    vi.mocked(revokeSessions).mockResolvedValue({ status: 'success', message: 'ok' })
    const store = useAuthStore()

    store.setToken('jwt')
    await store.logout()

    expect(revokeSessions).toHaveBeenCalledOnce()
    expect(store.token).toBeNull()
  })

  it('logout clears local state even when revoking fails', async () => {
    vi.mocked(revokeSessions).mockRejectedValue(new Error('network'))
    const store = useAuthStore()

    store.setToken('jwt')

    await expect(store.logout()).rejects.toThrow('network')
    expect(store.token).toBeNull()
  })
})

describe('notification store', () => {
  it('keeps the previous type when none is given', () => {
    const store = useNotificationStore()

    store.setCurrentMessage('Oops', 'danger')
    store.setCurrentMessage('Still red')

    expect(store.currentMessage).toBe('Still red')
    expect(store.currentMessageType).toBe('danger')
  })
})
