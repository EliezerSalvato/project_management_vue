import {
  byLabel,
  errorResponse,
  expect,
  fieldError,
  messageResponse,
  test,
} from './support/fixtures'

const PROFILES_PATH = '/api/v1/user/profiles'
const EMAIL_CHANGES_PATH = '/api/v1/user/email/changes'
const PASSWORD_CHANGES_PATH = '/api/v1/user/password/changes'
const REVOKES_PATH = '/api/v1/user/session/revokes'

test.describe('Profile', () => {
  test('requires authentication', async ({ page }) => {
    await page.goto('/users/profile')

    await expect(page).toHaveURL('/users/sign-in?redirect=/users/profile')
  })

  test.describe('when signed in', () => {
    test.beforeEach(async ({ page, api }) => {
      api.signIn()
      await page.goto('/users/profile')
      await expect(byLabel(page, 'First name')).toHaveValue('Ada')
    })

    test.describe('name', () => {
      test('maps API validation errors to the fields', async ({ page, api }) => {
        api.on('PATCH', PROFILES_PATH, {
          status: 422,
          body: errorResponse('Validation failed', { first_name: ['is too long'] }),
        })
        const panel = page.locator('.panel').filter({ hasText: 'Profile' }).first()

        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(fieldError(panel, 'firstName')).toHaveText('is too long')
        await expect(panel.locator('.notification-success')).toHaveCount(0)
      })

      test('shows a generic error when the server fails', async ({ page, api }) => {
        api.on('PATCH', PROFILES_PATH, { status: 500 })
        const panel = page.locator('.panel').filter({ hasText: 'Profile' }).first()

        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(panel.locator('.notification-danger')).toHaveText(
          'Something went wrong. Please try again.',
        )
      })

      test('is prefilled and can be updated', async ({ page, api }) => {
        api.on('PATCH', PROFILES_PATH, { body: messageResponse('Profile updated.') })
        const panel = page.locator('.panel').filter({ hasText: 'Profile' }).first()

        await expect(byLabel(panel, 'First name')).toHaveValue('Ada')
        await expect(byLabel(panel, 'Last name')).toHaveValue('Lovelace')

        await byLabel(panel, 'First name').fill('Augusta')
        await byLabel(panel, 'Last name').fill('King')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(panel.locator('.notification-success')).toContainText('Profile updated.')
        expect(api.lastBodyOf('PATCH', PROFILES_PATH)).toEqual({
          first_name: 'Augusta',
          last_name: 'King',
        })
      })

      test('validates required fields', async ({ page, api }) => {
        const panel = page.locator('.panel').filter({ hasText: 'Profile' }).first()

        await byLabel(panel, 'First name').fill('')
        await byLabel(panel, 'Last name').fill('')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(fieldError(panel, 'firstName')).toHaveText("can't be blank")
        await expect(fieldError(panel, 'lastName')).toHaveText("can't be blank")
        expect(api.requestsTo('PATCH', PROFILES_PATH)).toHaveLength(0)
      })
    })

    test.describe('email', () => {
      test('updates the email and ends the session', async ({ page, api }) => {
        api.on('PATCH', EMAIL_CHANGES_PATH, {
          body: messageResponse('Confirm your new email to finish the change.'),
        })
        const panel = page.locator('.panel').filter({ hasText: 'Change Email' })

        await expect(byLabel(panel, 'Email')).toHaveValue('ada@example.com')

        await byLabel(panel, 'Email').fill('augusta@example.com')
        await byLabel(panel, 'Current password').fill('secret123')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(page).toHaveURL('/users/sign-in')
        await expect(page.locator('.notification-success')).toContainText(
          'Confirm your new email to finish the change.',
        )
        expect(api.lastBodyOf('PATCH', EMAIL_CHANGES_PATH)).toEqual({
          new_email: 'augusta@example.com',
          current_password: 'secret123',
        })
        expect(api.requestsTo('DELETE', REVOKES_PATH)).toHaveLength(1)
      })

      test('shows a wrong current password error', async ({ page, api }) => {
        api.on('PATCH', EMAIL_CHANGES_PATH, {
          status: 422,
          body: errorResponse('Validation failed', { current_password: ['is invalid'] }),
        })
        const panel = page.locator('.panel').filter({ hasText: 'Change Email' })

        await byLabel(panel, 'Current password').fill('wrong')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(fieldError(panel, 'currentPassword')).toHaveText('is invalid')
        await expect(page).toHaveURL('/users/profile')
        expect(api.requestsTo('DELETE', REVOKES_PATH)).toHaveLength(0)
      })

      test('still logs out locally when revoking the session fails', async ({ page, api }) => {
        api.on('PATCH', EMAIL_CHANGES_PATH, {
          body: messageResponse('Confirm your new email to finish the change.'),
        })
        api.on('DELETE', REVOKES_PATH, { status: 500 })
        // The email change itself invalidates the server sessions.
        api.signOut()
        const panel = page.locator('.panel').filter({ hasText: 'Change Email' })

        await byLabel(panel, 'Current password').fill('secret123')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(page).toHaveURL('/users/sign-in')
        await expect(page.locator('.notification-success')).toContainText(
          'Confirm your new email to finish the change.',
        )
      })
    })

    test.describe('password', () => {
      test('shows a wrong current password error', async ({ page, api }) => {
        api.on('PATCH', PASSWORD_CHANGES_PATH, {
          status: 422,
          body: errorResponse('Validation failed', { current_password: ['is invalid'] }),
        })
        const panel = page.locator('.panel').filter({ hasText: 'Change Password' })

        await byLabel(panel, 'Current password').fill('wrong')
        await byLabel(panel, 'New password').fill('newsecret123')
        await byLabel(panel, 'Password confirmation').fill('newsecret123')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(fieldError(panel, 'currentPassword')).toHaveText('is invalid')
        await expect(page).toHaveURL('/users/profile')
        expect(api.requestsTo('DELETE', REVOKES_PATH)).toHaveLength(0)
      })

      test('validates length and confirmation', async ({ page, api }) => {
        const panel = page.locator('.panel').filter({ hasText: 'Change Password' })

        await byLabel(panel, 'Current password').fill('secret123')
        await byLabel(panel, 'New password').fill('short')
        await byLabel(panel, 'Password confirmation').fill('other')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(fieldError(panel, 'password')).toHaveText(
          'is too short (minimum is 8 characters)',
        )
        await expect(fieldError(panel, 'passwordConfirmation')).toHaveText(
          "doesn't match New password",
        )
        expect(api.requestsTo('PATCH', PASSWORD_CHANGES_PATH)).toHaveLength(0)
      })

      test('updates the password and ends the session', async ({ page, api }) => {
        api.on('PATCH', PASSWORD_CHANGES_PATH, {
          body: messageResponse('Password updated. Please sign in again.'),
        })
        const panel = page.locator('.panel').filter({ hasText: 'Change Password' })

        await byLabel(panel, 'Current password').fill('secret123')
        await byLabel(panel, 'New password').fill('newsecret123')
        await byLabel(panel, 'Password confirmation').fill('newsecret123')
        await panel.getByRole('button', { name: 'Save' }).click()

        await expect(page).toHaveURL('/users/sign-in')
        await expect(page.locator('.notification-success')).toContainText(
          'Password updated. Please sign in again.',
        )
        expect(api.lastBodyOf('PATCH', PASSWORD_CHANGES_PATH)).toEqual({
          current_password: 'secret123',
          password: 'newsecret123',
          password_confirmation: 'newsecret123',
        })
        expect(api.requestsTo('DELETE', REVOKES_PATH)).toHaveLength(1)
      })
    })
  })
})
