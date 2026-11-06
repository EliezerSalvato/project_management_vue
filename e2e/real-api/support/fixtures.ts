import type { APIRequestContext, Page } from '@playwright/test'
import { API_URL, MAILPIT_URL } from './env'
import { expect, test as base } from '@playwright/test'

import { byLabel } from '../../support/fixtures'

export { byLabel, fieldError } from '../../support/fixtures'

export const PASSWORD = 'secret123'

export type Credentials = {
  email: string
  password: string
  firstName: string
  lastName: string
}

type MailpitMessage = { ID: string }

export const test = base.extend({
  page: async ({ page, context, baseURL }, use) => {
    await context.addCookies([{ name: 'locale', value: 'en', url: baseURL! }])
    await use(page)
  },
})

/** Every test gets its own user, so tests can run in parallel against one database. */
export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

function decodeHtml(value: string) {
  return value.replaceAll('&amp;', '&')
}

/** Link (to `path`) from the newest email sent to `email`, waiting for it to arrive. */
export async function emailLink(request: APIRequestContext, email: string, path: string) {
  let link: string | undefined

  await expect
    .poll(
      async () => {
        const search = await request.get(`${MAILPIT_URL}/api/v1/search`, {
          params: { query: `to:"${email}"` },
        })
        const { messages } = (await search.json()) as { messages: MailpitMessage[] }

        for (const { ID } of messages) {
          const message = await request.get(`${MAILPIT_URL}/api/v1/message/${ID}`)
          const { HTML } = (await message.json()) as { HTML: string }
          const match = HTML.match(new RegExp(`href="([^"]*${path}\\?token=[^"]+)"`))

          if (match?.[1]) {
            link = decodeHtml(match[1])
            return true
          }
        }

        return false
      },
      { message: `email to ${email} with a ${path} link`, timeout: 15_000 },
    )
    .toBe(true)

  return link!
}

function tokenFrom(link: string) {
  return new URL(link).searchParams.get('token')!
}

/** Registers a user straight through the API (faster than the UI) and confirms the email. */
export async function createUser(
  request: APIRequestContext,
  { verified = true } = {},
): Promise<Credentials> {
  const user = { email: uniqueEmail(), password: PASSWORD, firstName: 'Ada', lastName: 'Lovelace' }
  const registration = await request.post(`${API_URL}/api/v1/user/registrations`, {
    data: {
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      password: user.password,
      password_confirmation: user.password,
    },
  })

  expect(registration.status(), await registration.text()).toBe(201)

  if (verified) {
    const link = await emailLink(request, user.email, '/users/confirmation')
    const confirmation = await request.post(`${API_URL}/api/v1/user/email/confirmations`, {
      data: { token: tokenFrom(link) },
    })

    expect(confirmation.ok(), await confirmation.text()).toBe(true)
  }

  return user
}

export async function signIn(
  page: Page,
  { email, password }: Pick<Credentials, 'email' | 'password'>,
  { rememberMe = false, redirect = '' } = {},
) {
  await page.goto(`/users/sign-in${redirect ? `?redirect=${redirect}` : ''}`)
  await byLabel(page, 'Email').fill(email)
  await byLabel(page, 'Password').fill(password)

  // The switch input is visually hidden, so toggle it through its label.
  if (rememberMe) {
    await page.getByText('Remember me').click()
    await expect(page.getByRole('switch', { name: 'Remember me' })).toBeChecked()
  }

  await page.getByRole('button', { name: 'Login' }).click()
}

export { expect }
