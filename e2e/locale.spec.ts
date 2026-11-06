import type { BrowserContext } from '@playwright/test'
import {
  defaultUser,
  expect,
  fieldError,
  sessionResponse,
  signInWithForm,
  test,
} from './support/fixtures'

async function localeCookie(context: BrowserContext) {
  const cookies = await context.cookies()

  return cookies.find((cookie) => cookie.name === 'locale')?.value
}

test.describe('Locale', () => {
  test.describe('first visit (no locale cookie)', () => {
    test.use({ appLocale: null })

    test('defaults to pt-BR', async ({ page, context }) => {
      await page.goto('/users/sign-in')

      await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
      await expect(page).toHaveTitle('Gerenciador de Projetos')

      await page.getByRole('button', { name: 'Entrar' }).click()

      await expect(fieldError(page, 'email')).toHaveText('não pode ficar em branco')
      expect(await localeCookie(context)).toBe('pt-BR')
    })

    test('translates client-side fallback errors', async ({ page, api }) => {
      api.on('POST', '/api/v1/user/authentications', { status: 500 })

      await page.goto('/users/sign-in')
      await signInWithForm(page)

      await expect(page.locator('.notification-danger .notification-text')).toHaveText(
        'Algo deu errado. Por favor, tente novamente.',
      )
    })
  })

  test('follows the cookie when present', async ({ page }) => {
    await page.goto('/users/sign-in')

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test("switches to the user's saved locale after login", async ({ page, api, context }) => {
    api.on('POST', '/api/v1/user/authentications', {
      body: sessionResponse({ ...defaultUser, locale: 'pt-BR' }),
    })

    await page.goto('/users/sign-in?redirect=/users/profile')
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

    await signInWithForm(page)

    await expect(page).toHaveURL('/users/profile')
    await expect(page.getByText('Perfil', { exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    expect(await localeCookie(context)).toBe('pt-BR')
  })
})
