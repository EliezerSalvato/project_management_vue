import { errorResponse, expect, messageResponse, test } from './support/fixtures'

const CONFIRMATIONS_PATH = '/api/v1/user/email/confirmations'

test.describe('Email confirmation', () => {
  test('shows an error when the token is missing', async ({ page, api }) => {
    await page.goto('/users/confirmation')

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Confirmation token is missing.',
    )
    expect(api.requestsTo('POST', CONFIRMATIONS_PATH)).toHaveLength(0)
  })

  test('confirms the email and redirects to login', async ({ page, api }) => {
    api.on('POST', CONFIRMATIONS_PATH, {
      body: messageResponse('Your email address has been confirmed.'),
    })

    await page.goto('/users/confirmation?token=confirm-token')

    await expect(page).toHaveURL('/users/sign-in')
    await expect(page.locator('.notification-success')).toContainText(
      'Your email address has been confirmed.',
    )
    expect(api.lastBodyOf('POST', CONFIRMATIONS_PATH)).toEqual({ token: 'confirm-token' })
  })

  test('shows the API error for an invalid token', async ({ page, api }) => {
    api.on('POST', CONFIRMATIONS_PATH, {
      status: 422,
      body: errorResponse('Validation failed', { token: ['is invalid'] }),
    })

    await page.goto('/users/confirmation?token=bad-token')

    await expect(page.locator('.notification-danger .notification-text')).toHaveText('is invalid')
    await expect(page).toHaveURL('/users/confirmation?token=bad-token')
  })
})
