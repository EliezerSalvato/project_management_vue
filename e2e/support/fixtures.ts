import type { Locator, Page } from '@playwright/test'
import { E2E_API_URL } from './env'
import { expect, test as base } from '@playwright/test'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type AppLocale = 'en' | 'pt-BR'

type MockResponse = {
  status?: number
  /** Omit to send an empty body (e.g. a proxy error page the app can't parse). */
  body?: unknown
  /** Simulates a network failure: the request never gets a response. */
  abort?: boolean
  /** Runs after the response is chosen, e.g. to change server-side state. */
  sideEffect?: () => void
}

export type RecordedRequest = {
  method: string
  path: string
  query: URLSearchParams
  /** Parsed JSON body; `null` for multipart or other non-JSON bodies. */
  body: unknown
  /** Body as sent, e.g. to assert multipart fields. */
  rawBody: string | null
  authorization: string | undefined
}

type MockHandler =
  MockResponse | ((request: RecordedRequest) => MockResponse | Promise<MockResponse>)

export type TestUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  locale?: AppLocale
}

export const defaultUser: TestUser = {
  id: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  locale: 'en',
}

export const REFRESH_PATH = '/api/v1/user/session/refreshes'
export const REVOKES_PATH = '/api/v1/user/session/revokes'

const CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
}

export function sessionResponse(user: TestUser = defaultUser, token = 'access-token') {
  return {
    status: 'success',
    type: 'object',
    data: {
      token,
      user: {
        data: {
          id: user.id,
          type: 'user',
          attributes: {
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            configs: user.locale ? { locale: user.locale } : {},
          },
        },
      },
    },
  }
}

export function messageResponse(message: string) {
  return { status: 'success', message }
}

export function errorResponse(message: string, details: Record<string, string[]> = {}) {
  return { status: 'error', message, details }
}

function parseJsonBody(rawBody: string | null, contentType: string | null) {
  if (rawBody === null || !contentType?.includes('application/json')) return null

  return JSON.parse(rawBody) as unknown
}

/** A promise the test resolves by hand, to hold a mocked response in flight. */
export function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

/**
 * In-memory fake of the backend. Unmocked endpoints answer 501 so a missing mock
 * fails loudly instead of hanging.
 */
export class ApiMock {
  readonly requests: RecordedRequest[] = []
  private readonly handlers = new Map<string, MockHandler>()

  constructor() {
    this.signOut()
  }

  on(method: HttpMethod, path: string, handler: MockHandler) {
    this.handlers.set(`${method} ${path}`, handler)
  }

  /** Session restore on navigation succeeds until the session is revoked. */
  signIn(user: TestUser = defaultUser, token = 'access-token') {
    this.on('PATCH', REFRESH_PATH, { body: sessionResponse(user, token) })
    this.on('DELETE', REVOKES_PATH, {
      body: messageResponse('Signed out successfully.'),
      sideEffect: () => this.signOut(),
    })
  }

  /** Guest (default): session restore on navigation fails. */
  signOut() {
    this.on('PATCH', REFRESH_PATH, { status: 401, body: errorResponse('Unauthorized') })
  }

  requestsTo(method: HttpMethod, path: string) {
    return this.requests.filter((request) => request.method === method && request.path === path)
  }

  lastBodyOf(method: HttpMethod, path: string) {
    return this.requestsTo(method, path).at(-1)?.body
  }

  async attach(page: Page, origin: string) {
    await page.route(`${E2E_API_URL}/**`, async (route) => {
      const request = route.request()
      const headers = { ...CORS_HEADERS, 'Access-Control-Allow-Origin': origin }

      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers })
        return
      }

      const url = new URL(request.url())
      const rawBody = request.postData()
      const recorded: RecordedRequest = {
        method: request.method(),
        path: url.pathname,
        query: url.searchParams,
        body: parseJsonBody(rawBody, await request.headerValue('content-type')),
        rawBody,
        authorization: (await request.headerValue('authorization')) ?? undefined,
      }

      this.requests.push(recorded)

      const handler = this.handlers.get(`${recorded.method} ${recorded.path}`) ?? {
        status: 501,
        body: errorResponse(`No e2e mock for ${recorded.method} ${recorded.path}`),
      }
      const response = typeof handler === 'function' ? await handler(recorded) : handler

      response.sideEffect?.()

      if (response.abort) {
        await route.abort('connectionfailed')
        return
      }

      await route.fulfill({
        status: response.status ?? 200,
        headers,
        contentType: 'application/json',
        body: response.body === undefined ? '' : JSON.stringify(response.body),
      })
    })
  }
}

type Fixtures = {
  /** Value of the `locale` cookie before the app boots; `null` = first visit (no cookie). */
  appLocale: AppLocale | null
  api: ApiMock
}

export const test = base.extend<Fixtures>({
  appLocale: ['en', { option: true }],
  // `auto` so the mock and locale cookie are in place before any navigation,
  // even in tests/hooks that don't destructure `api`.
  api: [
    async ({ page, context, baseURL, appLocale }, use) => {
      const origin = baseURL!
      const api = new ApiMock()

      if (appLocale) {
        await context.addCookies([{ name: 'locale', value: appLocale, url: origin }])
      }

      await api.attach(page, origin)
      await use(api)
    },
    { auto: true },
  ],
})

/**
 * Field by its visible label. Playwright matches the label's raw text, which includes the
 * required marker (`Email *`) even though it is aria-hidden, so the marker is optional here.
 */
export function byLabel(within: Page | Locator, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return within.getByLabel(new RegExp(`^${escaped}( \\*)?$`))
}

/** Wrapper `.form-field` of the input with the given `name` (scoped to `within`). */
export function formField(within: Page | Locator, name: string) {
  return within.locator(`.form-field:has(input[name="${name}"])`)
}

export function fieldError(within: Page | Locator, name: string) {
  return formField(within, name).locator('.form-help-error')
}

export async function signInWithForm(page: Page, { rememberMe = false } = {}) {
  await page.getByLabel(/^(Email|E-mail)$/).fill(defaultUser.email)
  await page.getByLabel(/^(Password|Senha)$/).fill('secret123')

  if (rememberMe) await page.getByRole('checkbox').check()

  await page.getByRole('button', { name: /^(Login|Entrar)$/ }).click()
}

export { expect }
