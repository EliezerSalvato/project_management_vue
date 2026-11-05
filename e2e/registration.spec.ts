import { byLabel, errorResponse, expect, fieldError, test } from './support/fixtures'

const REGISTRATION_PATH = '/api/v1/user/registrations'

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/sign-up')
  })

  test('validates required fields', async ({ page, api }) => {
    await page.getByRole('button', { name: 'Sign up' }).click()

    for (const name of ['email', 'firstName', 'lastName', 'password', 'passwordConfirmation']) {
      await expect(fieldError(page, name)).toHaveText("can't be blank")
    }

    expect(api.requestsTo('POST', REGISTRATION_PATH)).toHaveLength(0)
  })

  test('validates email format, password length and confirmation', async ({ page, api }) => {
    await byLabel(page, 'Email').fill('not-an-email')
    await byLabel(page, 'First name').fill('Ada')
    await byLabel(page, 'Last name').fill('Lovelace')
    await byLabel(page, 'Password').fill('short')
    await byLabel(page, 'Password confirmation').fill('different')
    await page.getByRole('button', { name: 'Sign up' }).click()

    await expect(fieldError(page, 'email')).toHaveText('is invalid')
    await expect(fieldError(page, 'password')).toHaveText('is too short (minimum is 8 characters)')
    await expect(fieldError(page, 'passwordConfirmation')).toHaveText("doesn't match Password")
    expect(api.requestsTo('POST', REGISTRATION_PATH)).toHaveLength(0)
  })

  test('registers and redirects to login with the API message', async ({ page, api }) => {
    api.on('POST', REGISTRATION_PATH, {
      status: 201,
      body: {
        status: 'success',
        type: 'object',
        message: 'Check your inbox to confirm your email.',
        data: { user: { data: { id: '1', type: 'user', attributes: {} } } },
      },
    })

    await byLabel(page, 'Email').fill('ada@example.com')
    await byLabel(page, 'First name').fill('Ada')
    await byLabel(page, 'Last name').fill('Lovelace')
    await byLabel(page, 'Password').fill('secret123')
    await byLabel(page, 'Password confirmation').fill('secret123')
    await page.getByRole('button', { name: 'Sign up' }).click()

    await expect(page).toHaveURL('/users/sign-in')
    await expect(page.locator('.notification-success')).toContainText(
      'Check your inbox to confirm your email.',
    )
    expect(api.lastBodyOf('POST', REGISTRATION_PATH)).toEqual({
      email: 'ada@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      password: 'secret123',
      password_confirmation: 'secret123',
    })
  })

  test('maps API validation details to their fields', async ({ page, api }) => {
    api.on('POST', REGISTRATION_PATH, {
      status: 422,
      body: errorResponse('Validation failed', {
        email: ['has already been taken'],
        first_name: ['is reserved'],
      }),
    })

    await byLabel(page, 'Email').fill('ada@example.com')
    await byLabel(page, 'First name').fill('Ada')
    await byLabel(page, 'Last name').fill('Lovelace')
    await byLabel(page, 'Password').fill('secret123')
    await byLabel(page, 'Password confirmation').fill('secret123')
    await page.getByRole('button', { name: 'Sign up' }).click()

    await expect(fieldError(page, 'email')).toHaveText('has already been taken')
    // Screen readers announce the error with the field.
    await expect(byLabel(page, 'Email')).toHaveAccessibleDescription('has already been taken')
    await expect(byLabel(page, 'Email')).toHaveAttribute('aria-invalid', 'true')
    await expect(fieldError(page, 'firstName')).toHaveText('is reserved')
    await expect(page).toHaveURL('/users/sign-up')
  })
})
