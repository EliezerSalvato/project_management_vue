import {
  byLabel,
  createUser,
  emailLink,
  expect,
  fieldError,
  signIn,
  test,
  uniqueEmail,
} from './support/fixtures'

const NEW_PASSWORD = 'newsecret456'

test.describe('Account (real API)', () => {
  test('resets a forgotten password through the email link', async ({ page, request }) => {
    const user = await createUser(request)

    await page.goto('/users/password/new')
    await byLabel(page, 'Email').fill(user.email)
    await page.getByRole('button', { name: 'Send me reset password instructions' }).click()
    await expect(page.locator('.notification-success')).toBeVisible()

    await page.goto(await emailLink(request, user.email, '/users/password/edit'))
    await byLabel(page, 'New password').fill(NEW_PASSWORD)
    await byLabel(page, 'Confirm new password').fill(NEW_PASSWORD)
    await page.getByRole('button', { name: 'Change my password' }).click()

    await expect(page).toHaveURL('/users/sign-in')
    await expect(page.locator('.notification-success')).toBeVisible()

    await signIn(page, { email: user.email, password: NEW_PASSWORD })
    await expect(page).toHaveURL('/projects')
  })

  test.describe('profile', () => {
    test('rejects a wrong current password', async ({ page, request }) => {
      const user = await createUser(request)

      await signIn(page, user, { redirect: '/users/profile' })
      const panel = page.locator('.project-form-panel').filter({ hasText: 'Change Password' })

      await byLabel(panel, 'Current password').fill('wrong-password')
      await byLabel(panel, 'New password').fill(NEW_PASSWORD)
      await byLabel(panel, 'Password confirmation').fill(NEW_PASSWORD)
      await panel.getByRole('button', { name: 'Save' }).click()

      await expect(fieldError(panel, 'currentPassword')).toHaveText('is invalid')
      await expect(page).toHaveURL('/users/profile')
    })

    test('changes the password and requires the new one', async ({ page, request }) => {
      const user = await createUser(request)

      await signIn(page, user, { redirect: '/users/profile' })
      const panel = page.locator('.project-form-panel').filter({ hasText: 'Change Password' })

      await byLabel(panel, 'Current password').fill(user.password)
      await byLabel(panel, 'New password').fill(NEW_PASSWORD)
      await byLabel(panel, 'Password confirmation').fill(NEW_PASSWORD)
      await panel.getByRole('button', { name: 'Save' }).click()

      await expect(page).toHaveURL('/users/sign-in')
      await expect(page.locator('.notification-success')).toBeVisible()

      await signIn(page, user)
      await expect(page.locator('.notification-danger .notification-text')).toHaveText(
        'Email or password is invalid',
      )

      await signIn(page, { email: user.email, password: NEW_PASSWORD })
      await expect(page).toHaveURL('/projects')
    })

    test('changes the email after confirming the new address', async ({ page, request }) => {
      const user = await createUser(request)
      const newEmail = uniqueEmail()

      await signIn(page, user, { redirect: '/users/profile' })
      const panel = page.locator('.project-form-panel').filter({ hasText: 'Change Email' })

      await byLabel(panel, 'Current password').fill(user.password)
      await byLabel(panel, 'Email').fill(newEmail)
      await panel.getByRole('button', { name: 'Save' }).click()

      await expect(page).toHaveURL('/users/sign-in')
      await expect(page.locator('.notification-success')).toBeVisible()

      await page.goto(await emailLink(request, newEmail, '/users/confirmation'))
      await expect(page).toHaveURL('/users/sign-in')

      await signIn(
        page,
        { email: newEmail, password: user.password },
        { redirect: '/users/profile' },
      )
      await expect(page).toHaveURL('/users/profile')
      await expect(byLabel(panel, 'Email')).toHaveValue(newEmail)
    })
  })
})
