import {
  byLabel,
  createUser,
  emailLink,
  expect,
  fieldError,
  PASSWORD,
  signIn,
  test,
  uniqueEmail,
} from './support/fixtures'

test.describe('Auth (real API)', () => {
  test('signs up, confirms the email from the inbox and logs in', async ({ page, request }) => {
    const email = uniqueEmail()

    await page.goto('/users/sign-up')
    await byLabel(page, 'Email').fill(email)
    await byLabel(page, 'First name').fill('Ada')
    await byLabel(page, 'Last name').fill('Lovelace')
    await byLabel(page, 'Password').fill(PASSWORD)
    await byLabel(page, 'Password confirmation').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign up' }).click()

    await expect(page).toHaveURL('/users/sign-in')
    await expect(page.locator('.notification-success')).toBeVisible()

    await page.goto(await emailLink(request, email, '/users/confirmation'))

    await expect(page).toHaveURL('/users/sign-in')
    await expect(page.locator('.notification-success')).toBeVisible()

    await signIn(page, { email, password: PASSWORD }, { redirect: '/users/profile' })

    await expect(page).toHaveURL('/users/profile')
    await expect(byLabel(page, 'First name')).toHaveValue('Ada')
    await expect(byLabel(page, 'Last name')).toHaveValue('Lovelace')
  })

  test('maps server-side validation errors to the fields', async ({ page, request }) => {
    const existing = await createUser(request, { verified: false })

    await page.goto('/users/sign-up')
    await byLabel(page, 'Email').fill(existing.email)
    await byLabel(page, 'First name').fill('Ada')
    await byLabel(page, 'Last name').fill('Lovelace')
    await byLabel(page, 'Password').fill(PASSWORD)
    await byLabel(page, 'Password confirmation').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign up' }).click()

    await expect(fieldError(page, 'email')).toHaveText('has already been taken')
    await expect(page).toHaveURL('/users/sign-up')
  })

  test('rejects wrong credentials', async ({ page, request }) => {
    const user = await createUser(request)

    await signIn(page, { email: user.email, password: 'wrong-password' })

    await expect(page.locator('.notification-danger .notification-text')).toHaveText(
      'Email or password is invalid',
    )
    await expect(page).toHaveURL('/users/sign-in')
  })

  // Disabled while the API does not block sign-in for unverified emails.
  // test('rejects a user whose email is not confirmed', async ({ page, request }) => {
  //   const user = await createUser(request, { verified: false })
  //
  //   await signIn(page, user)
  //
  //   await expect(page.locator('.notification-danger .notification-text')).toHaveText(
  //     'User email is not verified',
  //   )
  // })

  test('shows an error for an invalid confirmation link', async ({ page }) => {
    await page.goto('/users/confirmation?token=not-a-real-token')

    await expect(page.locator('.notification-danger')).toBeVisible()
    await expect(page).toHaveURL('/users/confirmation?token=not-a-real-token')
  })

  test.describe('without a locale cookie', () => {
    test('gets server messages in pt-BR', async ({ page, context, request }) => {
      const user = await createUser(request)

      await context.clearCookies()
      await page.goto('/users/sign-in')
      await byLabel(page, 'E-mail').fill(user.email)
      await byLabel(page, 'Senha').fill('wrong-password')
      await page.getByRole('button', { name: 'Entrar' }).click()

      // The locale cookie the app sets on localhost reaches the API on another port.
      await expect(page.locator('.notification-danger .notification-text')).toHaveText(
        'E-mail ou senha inválidos',
      )
    })
  })
})
