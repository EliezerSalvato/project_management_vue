import {
  byLabel,
  deferred,
  expect,
  sessionResponse,
  signInWithForm,
  test,
} from './support/fixtures'

const AUTH_PATH = '/api/v1/user/authentications'

test.describe('API failures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/sign-in')
  })

  test('shows a generic error when the server fails without a body', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, { status: 500 })

    await signInWithForm(page)

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Something went wrong. Please try again.',
    )
    await expect(page).toHaveURL('/users/sign-in')
  })

  test('shows a generic error when the API is unreachable', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, { abort: true })

    await signInWithForm(page)

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Something went wrong. Please try again.',
    )
  })

  test('shows a rate limit error on 429', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, { status: 429 })

    await signInWithForm(page)

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Too many requests. Wait a moment and try again.',
    )
  })

  test('prefers the API message over the fallback', async ({ page, api }) => {
    api.on('POST', AUTH_PATH, {
      status: 429,
      body: { status: 'error', message: 'Slow down: retry in 60 seconds.', details: {} },
    })

    await signInWithForm(page)

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Slow down: retry in 60 seconds.',
    )
  })

  test('disables the submit while the request is in flight', async ({ page, api }) => {
    const gate = deferred()
    api.on('POST', AUTH_PATH, async () => {
      await gate.promise

      return { body: sessionResponse() }
    })

    await signInWithForm(page)

    const submit = page.getByRole('button', { name: 'Login' })

    await expect(submit).toBeDisabled()
    await expect(submit).toHaveClass(/btn-loading/)

    // Implicit submission (Enter) must not fire a second request either.
    await byLabel(page, 'Password').press('Enter')
    gate.resolve()

    await expect(page).toHaveURL('/projects')
    expect(api.requestsTo('POST', AUTH_PATH)).toHaveLength(1)
  })
})
