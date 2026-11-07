import type { UserResource } from '@/types/user'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { getCookie } from '@/utils/cookies'
import { ApiError, apiRequest } from '@/api/client'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/locales'
import router from '@/router'

vi.mock('@/router', () => ({
  default: {
    currentRoute: { value: { name: 'home', fullPath: '/projects' } },
    push: vi.fn(),
  },
}))

const BASE_URL = 'http://api.test'
const REFRESH_PATH = '/api/v1/user/session/refreshes'

const userResource: UserResource = {
  data: {
    id: '1',
    type: 'user',
    attributes: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
  },
}

function jsonResponse(status: number, body: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function refreshSuccess(token = 'new-jwt') {
  return jsonResponse(200, {
    status: 'success',
    type: 'object',
    data: { token, user: userResource },
  })
}

function headersOf(call: unknown[]) {
  return (call[1] as RequestInit).headers as Record<string, string>
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(router.push).mockReset()
  router.currentRoute.value.name = 'home'
  localStorage.clear()
  setActivePinia(createPinia())
  i18n.global.locale.value = 'en'
})

describe('apiRequest', () => {
  it('sends JSON headers, credentials and the base URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))

    const data = await apiRequest('/api/v1/ping', { method: 'POST', body: '{}' })

    expect(data).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/v1/ping`, {
      method: 'POST',
      body: '{}',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'Content-Type': 'application/json',
      },
    })
  })

  it('sends the current i18n locale as Accept-Language', async () => {
    i18n.global.locale.value = 'pt-BR'
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await apiRequest('/api/v1/ping')

    expect(headersOf(fetchMock.mock.calls[0]!)['Accept-Language']).toBe('pt-BR')
  })

  it('sends FormData without a JSON content type', async () => {
    useAuthStore().setToken('jwt')
    fetchMock.mockResolvedValue(jsonResponse(200, {}))
    const body = new FormData()
    body.append('name', 'Website')

    await apiRequest('/api/v1/projects', { method: 'POST', body })

    const headers = headersOf(fetchMock.mock.calls[0]!)
    expect(fetchMock.mock.calls[0]![1]!.body).toBe(body)
    expect(headers).not.toHaveProperty('Content-Type')
    expect(headers.Accept).toBe('application/json')
    expect(headers.Authorization).toBe('Bearer jwt')
  })

  it('keeps the JSON content type for string bodies', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await apiRequest('/api/v1/ping', { method: 'PATCH', body: '{}' })

    expect(headersOf(fetchMock.mock.calls[0]!)['Content-Type']).toBe('application/json')
  })

  it('adds the bearer token when authenticated', async () => {
    useAuthStore().setToken('jwt')
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await apiRequest('/api/v1/ping')

    expect(headersOf(fetchMock.mock.calls[0]!).Authorization).toBe('Bearer jwt')
  })

  it('syncs the locale cookie with the current i18n locale', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await apiRequest('/api/v1/ping')

    expect(getCookie('locale')).toBe('en')
  })

  it('throws ApiError with the API message and details', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        status: 'error',
        message: 'Validation failed',
        details: { email: ['is invalid'] },
      }),
    )

    const error = await apiRequest('/api/v1/users').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      message: 'Validation failed',
      details: { email: ['is invalid'] },
    })
  })

  it('uses a fallback message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 500 }))

    await expect(apiRequest('/api/v1/users')).rejects.toMatchObject({
      status: 500,
      message: 'Something went wrong. Please try again.',
      details: {},
    })
  })

  it('uses a specific fallback message for rate limiting', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }))

    await expect(apiRequest('/api/v1/users')).rejects.toMatchObject({
      message: 'Too many requests. Wait a moment and try again.',
    })
  })

  describe('on 401', () => {
    it('refreshes the token and retries the request once', async () => {
      const authStore = useAuthStore()
      authStore.setToken('expired')
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
        .mockResolvedValueOnce(refreshSuccess())
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

      const data = await apiRequest('/api/v1/projects')

      expect(data).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls[1]![0]).toBe(`${BASE_URL}${REFRESH_PATH}`)
      expect(headersOf(fetchMock.mock.calls[2]!).Authorization).toBe('Bearer new-jwt')
      expect(authStore.token).toBe('new-jwt')
      expect(useUserStore().user?.fullName).toBe('Ada Lovelace')
    })

    it('sends rememberMe in the refresh payload', async () => {
      useAuthStore().setRememberMe(true)
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, {}))
        .mockResolvedValueOnce(refreshSuccess())
        .mockResolvedValueOnce(jsonResponse(200, {}))

      await apiRequest('/api/v1/projects')

      expect(JSON.parse(fetchMock.mock.calls[1]![1]!.body as string)).toEqual({
        remember_me: true,
      })
    })

    it('shares a single refresh between concurrent requests', async () => {
      fetchMock.mockImplementation(async (url, init) => {
        if (String(url).endsWith(REFRESH_PATH)) return refreshSuccess()

        const auth = new Headers(init?.headers).get('Authorization')

        return auth === 'Bearer new-jwt' ? jsonResponse(200, {}) : jsonResponse(401, {})
      })

      await Promise.all([apiRequest('/api/v1/a'), apiRequest('/api/v1/b')])

      const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith(REFRESH_PATH),
      )
      expect(refreshCalls).toHaveLength(1)
    })

    it('clears the session and redirects to sign in when refresh fails', async () => {
      const authStore = useAuthStore()
      authStore.setToken('expired')
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized', details: {} }))
        .mockResolvedValueOnce(jsonResponse(401, { message: 'Refresh expired' }))

      await expect(apiRequest('/api/v1/projects')).rejects.toMatchObject({
        status: 401,
        message: 'Unauthorized',
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(authStore.token).toBeNull()
      expect(router.push).toHaveBeenCalledWith({
        name: 'signIn',
        query: { redirect: '/projects' },
      })
    })

    it('does not redirect when already on the sign in page', async () => {
      router.currentRoute.value.name = 'signIn'
      fetchMock.mockResolvedValue(jsonResponse(401, {}))

      await expect(apiRequest('/api/v1/projects')).rejects.toBeInstanceOf(ApiError)
      expect(router.push).not.toHaveBeenCalled()
    })

    it('does not try to refresh when skipAuthRetry is set', async () => {
      fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Invalid credentials' }))

      await expect(
        apiRequest('/api/v1/user/authentications', { skipAuthRetry: true }),
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' })
      expect(fetchMock).toHaveBeenCalledOnce()
      expect(router.push).not.toHaveBeenCalled()
    })
  })
})
