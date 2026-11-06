import type { APIRequestContext, Page } from '@playwright/test'
import type { Credentials } from './fixtures'
import { API_URL } from './env'
import { expect } from './fixtures'

export { PNG_BYTES, isoDate } from '../../support/projects'

export type ProjectAttributes = {
  id: string
  name: string
  client_name: string
  start_date: string
  end_date: string
  favorite: boolean
  cover_image_url: string | null
}

export type NewProject = Pick<ProjectAttributes, 'name' | 'client_name' | 'start_date' | 'end_date'>

/** Bearer token for `user`, to seed and inspect projects straight through the API. */
export async function apiToken(request: APIRequestContext, { email, password }: Credentials) {
  const response = await request.post(`${API_URL}/api/v1/user/authentications`, {
    data: { email, password, remember_me: false },
  })

  expect(response.ok(), await response.text()).toBe(true)

  const { data } = (await response.json()) as { data: { token: string } }
  return data.token
}

export async function seedProject(request: APIRequestContext, token: string, project: NewProject) {
  const response = await request.post(`${API_URL}/api/v1/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    data: project,
  })

  expect(response.status(), await response.text()).toBe(201)

  const { data } = (await response.json()) as {
    data: { project: { data: { attributes: ProjectAttributes } } }
  }
  return data.project.data.attributes
}

/** Every project of the token's user (follows the cursor across pages). */
export async function listProjects(request: APIRequestContext, token: string) {
  const projects: ProjectAttributes[] = []
  let after: string | null = null

  do {
    const response = await request.get(`${API_URL}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: after ? { after } : {},
    })

    expect(response.ok(), await response.text()).toBe(true)

    const { data } = (await response.json()) as {
      data: {
        projects: { data: { attributes: ProjectAttributes }[] }
        pagination: { next: string | null }
      }
    }
    projects.push(...data.projects.data.map(({ attributes }) => attributes))
    after = data.pagination.next
  } while (after)

  return projects
}

export function card(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true })
}

export function cardNames(page: Page) {
  return page.getByRole('heading', { level: 2 })
}

/** Fills every field of the project form (English labels). */
export async function fillProjectForm(
  page: Page,
  values: { name: string; clientName: string; startDate: string; endDate: string },
) {
  await page.getByLabel('Project name').fill(values.name)
  await page.getByLabel('Client').fill(values.clientName)
  await page.getByLabel('Start date').fill(values.startDate)
  await page.getByLabel('End date').fill(values.endDate)
}

export async function pickCover(page: Page, buffer: Buffer, name = 'cover.png') {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Select' }).click()
  await (await chooser).setFiles({ name, mimeType: 'image/png', buffer })
}

/** The image actually loaded (the blob URL resolves and the browser decoded it). */
export async function expectImageLoaded(page: Page, selector: ReturnType<Page['locator']>) {
  await expect(selector).toBeVisible()
  await expect
    .poll(() => selector.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true)
}
