import type { Page } from '@playwright/test'
import { API_URL } from './support/env'
import { byLabel, createUser, expect, signIn, test } from './support/fixtures'

const PROFILES_URL = `${API_URL}/api/v1/user/profiles`
const REFRESH_URL = `${API_URL}/api/v1/user/session/refreshes`

async function refreshCookie(page: Page) {
  const cookies = await page.context().cookies(API_URL)

  return cookies.find((cookie) => cookie.name === 'refresh_token')
}

test.describe('Session (real API)', () => {
  test('restores the session from the httpOnly refresh cookie', async ({ page, request }) => {
    const user = await createUser(request)

    await signIn(page, user, { redirect: '/users/profile' })
    await expect(page).toHaveURL('/users/profile')

    const cookie = await refreshCookie(page)

    expect(cookie?.httpOnly).toBe(true)
    expect(await page.evaluate(() => document.cookie)).not.toContain('refresh_token')

    await page.reload()

    await expect(page).toHaveURL('/users/profile')
    await expect(byLabel(page, 'First name')).toHaveValue('Ada')
  })

  test('remember me makes the refresh cookie persistent', async ({ page, request }) => {
    const user = await createUser(request)

    await signIn(page, user, { rememberMe: true })
    await expect(page).toHaveURL('/')

    const expires = (await refreshCookie(page))?.expires ?? -1
    const inDays = (expires * 1000 - Date.now()) / (24 * 60 * 60 * 1000)

    expect(inDays).toBeGreaterThan(29)

    // The refresh keeps asking for (and getting) a long-lived cookie.
    await page.reload()
    await expect(page).toHaveURL('/')
    expect(((await refreshCookie(page))?.expires ?? -1) > 0).toBe(true)
  })

  test('without remember me the refresh cookie ends with the browser', async ({
    page,
    request,
  }) => {
    const user = await createUser(request)

    await signIn(page, user)
    await expect(page).toHaveURL('/')

    expect((await refreshCookie(page))?.expires).toBe(-1)
  })

  test('renews an expired access token and retries the request', async ({ page, request }) => {
    const user = await createUser(request)
    const refreshes: string[] = []

    page.on('request', (req) => {
      if (req.url() === REFRESH_URL) refreshes.push(req.method())
    })

    await signIn(page, user, { redirect: '/users/profile' })
    await expect(byLabel(page, 'First name')).toHaveValue('Ada')

    // Access tokens live 15 minutes; simulate the expiry on the first profile update only.
    await page.route(
      PROFILES_URL,
      async (route) => {
        const headers = { ...route.request().headers(), authorization: 'Bearer expired-token' }
        await route.continue({ headers })
      },
      { times: 1 },
    )

    const refreshesBefore = refreshes.length

    await byLabel(page, 'First name').fill('Augusta')
    await page.getByRole('button', { name: 'Save' }).first().click()

    await expect(page.locator('.notification-success')).toBeVisible()
    expect(refreshes.length).toBe(refreshesBefore + 1)

    await page.reload()
    await expect(byLabel(page, 'First name')).toHaveValue('Augusta')
  })

  test('a login elsewhere revokes this session', async ({ page, request }) => {
    const user = await createUser(request)

    await signIn(page, user, { redirect: '/users/profile' })
    await expect(page).toHaveURL('/users/profile')

    // The API keeps one active session per user: a new login revokes the others.
    const otherLogin = await request.post(`${API_URL}/api/v1/user/authentications`, {
      data: { email: user.email, password: user.password },
    })
    expect(otherLogin.ok()).toBe(true)

    await page.reload()

    await expect(page).toHaveURL('/users/sign-in?redirect=/users/profile')
  })
})
