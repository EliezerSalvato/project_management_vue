import {
  byLabel,
  errorResponse,
  expect,
  fieldError,
  messageResponse,
  test,
} from './support/fixtures'

const RESETS_PATH = '/api/v1/user/password/resets'

test.describe('Forgot password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/password/new')
  })

  test('validates the email', async ({ page, api }) => {
    const submit = page.getByRole('button', { name: 'Send me reset password instructions' })

    await submit.click()
    await expect(fieldError(page, 'email')).toHaveText("can't be blank")

    await byLabel(page, 'Email').fill('invalid')
    await submit.click()
    await expect(fieldError(page, 'email')).toHaveText('is invalid')

    expect(api.requestsTo('POST', RESETS_PATH)).toHaveLength(0)
  })

  test('sends reset instructions', async ({ page, api }) => {
    api.on('POST', RESETS_PATH, {
      body: messageResponse('You will receive an email with instructions shortly.'),
    })

    await byLabel(page, 'Email').fill('ada@example.com')
    await page.getByRole('button', { name: 'Send me reset password instructions' }).click()

    await expect(page.locator('.notification-success')).toContainText(
      'You will receive an email with instructions shortly.',
    )
    expect(api.lastBodyOf('POST', RESETS_PATH)).toEqual({ email: 'ada@example.com' })

    await page.locator('.notification-success').getByRole('button', { name: 'close' }).click()
    await expect(page.locator('.notification')).toHaveCount(0)
  })

  test('shows the API error for an unknown email', async ({ page, api }) => {
    api.on('POST', RESETS_PATH, {
      status: 404,
      body: errorResponse('Email not found.'),
    })

    await byLabel(page, 'Email').fill('nobody@example.com')
    await page.getByRole('button', { name: 'Send me reset password instructions' }).click()

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Email not found.',
    )
    await expect(page.locator('.notification-success')).toHaveCount(0)
  })
})

test.describe('Reset password', () => {
  test('requires the token from the email link', async ({ page, api }) => {
    await page.goto('/users/password/edit')
    await byLabel(page, 'New password').fill('newsecret123')
    await byLabel(page, 'Confirm new password').fill('newsecret123')
    await page.getByRole('button', { name: 'Change my password' }).click()

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      "can't be blank",
    )
    expect(api.requestsTo('PATCH', RESETS_PATH)).toHaveLength(0)
  })

  test('validates password length and confirmation', async ({ page }) => {
    await page.goto('/users/password/edit?token=reset-token')
    await byLabel(page, 'New password').fill('short')
    await byLabel(page, 'Confirm new password').fill('other')
    await page.getByRole('button', { name: 'Change my password' }).click()

    await expect(fieldError(page, 'password')).toHaveText('is too short (minimum is 8 characters)')
    await expect(fieldError(page, 'passwordConfirmation')).toHaveText("doesn't match New password")
  })

  test('changes the password and redirects to login', async ({ page, api }) => {
    api.on('PATCH', RESETS_PATH, { body: messageResponse('Your password has been changed.') })

    await page.goto('/users/password/edit?token=reset-token')
    await byLabel(page, 'New password').fill('newsecret123')
    await byLabel(page, 'Confirm new password').fill('newsecret123')
    await page.getByRole('button', { name: 'Change my password' }).click()

    await expect(page).toHaveURL('/users/sign-in')
    await expect(page.locator('.notification-success')).toContainText(
      'Your password has been changed.',
    )
    expect(api.lastBodyOf('PATCH', RESETS_PATH)).toEqual({
      token: 'reset-token',
      password: 'newsecret123',
      password_confirmation: 'newsecret123',
    })
  })

  test('shows an expired token error from the API', async ({ page, api }) => {
    api.on('PATCH', RESETS_PATH, {
      status: 422,
      body: errorResponse('Validation failed', { reset_password_token: ['has expired'] }),
    })

    await page.goto('/users/password/edit?token=expired')
    await byLabel(page, 'New password').fill('newsecret123')
    await byLabel(page, 'Confirm new password').fill('newsecret123')
    await page.getByRole('button', { name: 'Change my password' }).click()

    await expect(page.locator('.notification-danger .notification-text')).toHaveText('has expired')
    await expect(page).toHaveURL('/users/password/edit?token=expired')
  })
})
