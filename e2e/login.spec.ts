import {
  byLabel,
  errorResponse,
  expect,
  fieldError,
  sessionResponse,
  test,
} from './support/fixtures'

const AUTH_PATH = '/api/v1/user/authentications'

test.describe('Login', () => {
  test('validates required fields without calling the API', async ({ page, api }) => {
    await page.goto('/users/sign-in')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(fieldError(page, 'email')).toHaveText("can't be blank")
    await expect(fieldError(page, 'password')).toHaveText("can't be blank")
    expect(api.requestsTo('POST', AUTH_PATH)).toHaveLength(0)
  })

  test('signs in and redirects to home', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, { body: sessionResponse() })

    await page.goto('/users/sign-in')
    await byLabel(page, 'Email').fill('ada@example.com')
    await byLabel(page, 'Password').fill('secret123')
    await page.getByLabel('Remember me').check()
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL('/projects')
    expect(api.lastBodyOf('POST', AUTH_PATH)).toEqual({
      email: 'ada@example.com',
      password: 'secret123',
      remember_me: true,
    })
    expect(await page.evaluate(() => localStorage.getItem('rememberMe'))).toBe('true')
  })

  test('returns to the protected page that required login', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, { body: sessionResponse() })

    await page.goto('/users/profile')
    await expect(page).toHaveURL('/users/sign-in?redirect=/users/profile')

    await byLabel(page, 'Email').fill('ada@example.com')
    await byLabel(page, 'Password').fill('secret123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL('/users/profile')
    await expect(page.getByText('Profile', { exact: true })).toBeVisible()
  })

  test('ignores unsafe redirect targets', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, { body: sessionResponse() })

    await page.goto('/users/sign-in?redirect=//evil.example.com')
    await byLabel(page, 'Email').fill('ada@example.com')
    await byLabel(page, 'Password').fill('secret123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL('/projects')
  })

  test('shows the API error on invalid credentials', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, {
      status: 401,
      body: errorResponse('Invalid email or password.'),
    })

    await page.goto('/users/sign-in')
    await byLabel(page, 'Email').fill('ada@example.com')
    await byLabel(page, 'Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.locator('.notification-danger')).toHaveText('Invalid email or password.')
    await expect(page).toHaveURL('/users/sign-in')

    await page.locator('.notification-danger').getByRole('button', { name: 'close' }).click()
    await expect(page.locator('.notification')).toHaveCount(0)
  })

  for (const path of [
    '/users/sign-in',
    '/users/sign-up',
    '/users/password/new',
    '/users/password/edit?token=abc',
  ]) {
    test(`redirects an authenticated user away from ${path}`, async ({ page, api }) => {
      api.signIn()

      await page.goto(path)

      await expect(page).toHaveURL('/projects')
    })
  }

  test('navigates to the other auth pages', async ({ page }) => {
    await page.goto('/users/sign-in')

    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/users/sign-up')

    await page.getByRole('link', { name: 'Forgot your password?' }).click()
    await expect(page).toHaveURL('/users/password/new')
  })
})
