import type { RecordedRequest } from './support/fixtures'
import {
  byLabel,
  REFRESH_PATH,
  errorResponse,
  expect,
  messageResponse,
  sessionResponse,
  signInWithForm,
  test,
} from './support/fixtures'

const PROFILES_PATH = '/api/v1/user/profiles'
const PASSWORD_CHANGES_PATH = '/api/v1/user/password/changes'

const unauthorized = { status: 401, body: errorResponse('Token expired') }

/** Accepts only the token issued by the refresh; anything older is treated as expired. */
function acceptsOnly(token: string, success: { status?: number; body: unknown }) {
  return ({ authorization }: RecordedRequest) =>
    authorization === `Bearer ${token}` ? success : unauthorized
}

test.describe('Session', () => {
  test('sends the access token returned by the login', async ({ page, api }) => {
    api.on('POST', '/api/v1/user/authentications', { body: sessionResponse() })
    api.on('PATCH', PROFILES_PATH, { body: messageResponse('Profile updated.') })

    await page.goto('/users/sign-in?redirect=/users/profile')
    await signInWithForm(page)
    await expect(page).toHaveURL('/users/profile')
    await page.getByRole('button', { name: 'Save' }).first().click()

    await expect(page.locator('.notification-success')).toContainText('Profile updated.')
    expect(api.requestsTo('PATCH', PROFILES_PATH)[0]?.authorization).toBe('Bearer access-token')
  })

  test.describe('when the access token expires', () => {
    test.beforeEach(async ({ page, api }) => {
      api.signIn()
      await page.goto('/users/profile')
      await expect(byLabel(page, 'First name')).toHaveValue('Ada')
    })

    test('refreshes the token and retries the request', async ({ page, api }) => {
      api.signIn(undefined, 'refreshed-token')
      api.on(
        'PATCH',
        PROFILES_PATH,
        acceptsOnly('refreshed-token', { body: messageResponse('Profile updated.') }),
      )

      await page.getByRole('button', { name: 'Save' }).first().click()

      await expect(page.locator('.notification-success')).toContainText('Profile updated.')
      expect(api.requestsTo('PATCH', PROFILES_PATH).map((r) => r.authorization)).toEqual([
        'Bearer access-token',
        'Bearer refreshed-token',
      ])
      await expect(page).toHaveURL('/users/profile')
    })

    test('logs out and redirects to login when the refresh fails', async ({ page, api }) => {
      api.signOut()
      api.on('PATCH', PROFILES_PATH, unauthorized)

      await page.getByRole('button', { name: 'Save' }).first().click()

      await expect(page).toHaveURL('/users/sign-in')

      // Local session was cleared: protected pages ask for login again.
      await page.goto('/users/profile')
      await expect(page).toHaveURL('/users/sign-in?redirect=/users/profile')
    })

    test('shares a single refresh between concurrent 401s', async ({ page, api }) => {
      const refreshesBefore = api.requestsTo('PATCH', REFRESH_PATH).length
      const bothRejected = () =>
        api.requestsTo('PATCH', PROFILES_PATH).length > 0 &&
        api.requestsTo('PATCH', PASSWORD_CHANGES_PATH).length > 0

      // Hold the refresh until both requests got their 401, so the second one finds it in flight.
      api.on('PATCH', REFRESH_PATH, async () => {
        await expect.poll(bothRejected).toBe(true)
        await page.waitForTimeout(300)

        return { body: sessionResponse(undefined, 'refreshed-token') }
      })
      api.on(
        'PATCH',
        PROFILES_PATH,
        acceptsOnly('refreshed-token', { body: messageResponse('Profile updated.') }),
      )
      api.on(
        'PATCH',
        PASSWORD_CHANGES_PATH,
        acceptsOnly('refreshed-token', {
          status: 422,
          body: errorResponse('Validation failed', { current_password: ['is invalid'] }),
        }),
      )

      const passwordPanel = page.locator('.panel').filter({ hasText: 'Change Password' })

      await byLabel(passwordPanel, 'Current password').fill('wrong-password')
      await byLabel(passwordPanel, 'New password').fill('newsecret123')
      await byLabel(passwordPanel, 'Password confirmation').fill('newsecret123')

      await page.getByRole('button', { name: 'Save' }).first().click()
      await passwordPanel.getByRole('button', { name: 'Save' }).click()

      await expect(page.locator('.notification-success')).toContainText('Profile updated.')
      await expect(passwordPanel.locator('.form-help-error').first()).toHaveText('is invalid')
      expect(api.requestsTo('PATCH', REFRESH_PATH)).toHaveLength(refreshesBefore + 1)
    })
  })

  test.describe('remember me', () => {
    test.beforeEach(async ({ api }) => {
      api.on('POST', '/api/v1/user/authentications', { body: sessionResponse() })
    })

    test('keeps asking for a long-lived session after a reload', async ({ page, api }) => {
      await page.goto('/users/sign-in')
      await signInWithForm(page, { rememberMe: true })
      await expect(page).toHaveURL('/projects')

      api.signIn()
      await page.reload()

      await expect(page).toHaveURL('/projects')
      expect(api.lastBodyOf('PATCH', REFRESH_PATH)).toEqual({ remember_me: true })
    })

    test('asks for a short session when unchecked', async ({ page, api }) => {
      await page.goto('/users/sign-in')
      await signInWithForm(page)
      await expect(page).toHaveURL('/projects')

      expect(await page.evaluate(() => localStorage.getItem('rememberMe'))).toBeNull()
      expect(api.lastBodyOf('POST', '/api/v1/user/authentications')).toMatchObject({
        remember_me: false,
      })

      api.signIn()
      await page.reload()

      await expect(page).toHaveURL('/projects')
      expect(api.lastBodyOf('PATCH', REFRESH_PATH)).toEqual({ remember_me: false })
    })
  })
})
