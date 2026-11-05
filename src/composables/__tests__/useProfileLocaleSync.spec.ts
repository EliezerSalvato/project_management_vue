import type { User } from '@/types/user'
import { ApiError } from '@/api/client'
import { updateProfile } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { getCookie } from '@/utils/cookies'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick } from 'vue'
import {
  applyAppLocale,
  syncProfileLocale,
  useProfileLocaleSync,
} from '@/composables/useProfileLocaleSync'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/locales'

vi.mock('@/api/user', () => ({ updateProfile: vi.fn() }))

const user: User = {
  id: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  fullName: 'Ada Lovelace',
  configs: { locale: 'pt-BR' },
}

function signIn(value: User = user) {
  useAuthStore().setToken('jwt')
  useUserStore().setUser(value)
}

beforeEach(() => {
  vi.mocked(updateProfile).mockReset()
  setActivePinia(createPinia())
  document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  i18n.global.locale.value = 'en'
})

describe('applyAppLocale', () => {
  it('updates i18n, the cookie and the html lang', () => {
    applyAppLocale('pt-BR')

    expect(i18n.global.locale.value).toBe('pt-BR')
    expect(getCookie('locale')).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })
})

describe('syncProfileLocale', () => {
  it('does nothing for guests', async () => {
    await syncProfileLocale('en')

    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('does nothing when the locale is already saved', async () => {
    signIn()

    await syncProfileLocale('pt-BR')

    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('saves the new locale keeping name and other configs', async () => {
    vi.mocked(updateProfile).mockResolvedValue({ status: 'success', message: 'ok' })
    signIn()

    await syncProfileLocale('en')

    expect(updateProfile).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      configs: { locale: 'en' },
    })
    expect(useUserStore().user?.configs.locale).toBe('en')
  })

  it('shows the API error message and keeps the user unchanged on failure', async () => {
    vi.mocked(updateProfile).mockRejectedValue(
      new ApiError(422, { status: 'error', message: 'Could not save', details: {} }),
    )
    signIn()

    await syncProfileLocale('en')

    const notificationStore = useNotificationStore()
    expect(notificationStore.currentMessage).toBe('Could not save')
    expect(notificationStore.currentMessageType).toBe('danger')
    expect(useUserStore().user?.configs.locale).toBe('pt-BR')
  })

  it('shows a generic message for unexpected errors', async () => {
    vi.mocked(updateProfile).mockRejectedValue(new Error('network'))
    signIn()

    await syncProfileLocale('en')

    expect(useNotificationStore().currentMessage).toBe('Something went wrong. Please try again.')
  })
})

describe('useProfileLocaleSync', () => {
  function run() {
    const scope = effectScope()
    scope.run(() => useProfileLocaleSync())

    return scope
  }

  it('applies the cookie/default locale for guests', () => {
    document.cookie = 'locale=en; path=/'
    i18n.global.locale.value = 'pt-BR'

    const scope = run()

    expect(i18n.global.locale.value).toBe('en')
    scope.stop()
  })

  it('applies the user locale after sign in and follows changes', async () => {
    const scope = run()

    signIn({ ...user, configs: { locale: 'pt-BR' } })
    await nextTick()

    expect(i18n.global.locale.value).toBe('pt-BR')

    useUserStore().setUser({ ...user, configs: { locale: 'en' } })
    await nextTick()

    expect(i18n.global.locale.value).toBe('en')
    scope.stop()
  })
})
