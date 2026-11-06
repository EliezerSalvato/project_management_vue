import type { Page } from '@playwright/test'
import type { TestUser } from './fixtures'
import { defaultUser } from './fixtures'

export const PROJECTS_PATH = '/api/v1/projects'

export function projectPath(id: string) {
  return `${PROJECTS_PATH}/${id}`
}

export function favoritePath(id: string) {
  return `${projectPath(id)}/favorite`
}

export type TestProject = {
  id: string
  name: string
  clientName: string
  startDate: string
  endDate: string
  favorite: boolean
  coverImageUrl: string | null
}

export type TestPagination = { next: string | null; count: number; limit: number }

export const PROJECTS_PER_PAGE = 10

export function buildProject(overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: '1',
    name: 'Website Redesign',
    clientName: 'Acme Corp',
    startDate: '2024-09-01',
    endDate: '2024-12-20',
    favorite: false,
    coverImageUrl: null,
    ...overrides,
  }
}

/** `count` projects with ids 1..count and distinct names. */
export function buildProjects(count: number, overrides: Partial<TestProject> = {}) {
  return Array.from({ length: count }, (_, index) =>
    buildProject({ id: String(index + 1), name: `Project ${index + 1}`, ...overrides }),
  )
}

/** JSON:API resource as `Project::Serializer` renders it. */
export function projectResource(overrides: Partial<TestProject> = {}) {
  const project = buildProject(overrides)

  return {
    id: project.id,
    type: 'project',
    attributes: {
      id: project.id,
      name: project.name,
      client_name: project.clientName,
      start_date: project.startDate,
      end_date: project.endDate,
      favorite: project.favorite,
      cover_image_url: project.coverImageUrl,
    },
  }
}

/** `GET /api/v1/projects` body; pagination defaults to a single page holding every project. */
export function projectsPage(projects: TestProject[], pagination: Partial<TestPagination> = {}) {
  return {
    status: 'success',
    type: 'object',
    data: {
      projects: { data: projects.map((project) => projectResource(project)) },
      pagination: {
        next: null,
        count: projects.length,
        limit: PROJECTS_PER_PAGE,
        ...pagination,
      },
    },
  }
}

/** Show, favorite, create and update body; create/update also carry `message`. */
export function projectResponse(project: TestProject = buildProject(), message?: string) {
  return {
    status: 'success',
    type: 'object',
    ...(message === undefined ? {} : { message }),
    data: { project: { data: projectResource(project) } },
  }
}

/** Signed-in user whose profile locale keeps the app in pt-BR (the captures' language). */
export const ptBrUser: TestUser = { ...defaultUser, locale: 'pt-BR' }

/** Local calendar date `offsetDays` from today, as `YYYY-MM-DD` (the date input's value). */
export function isoDate(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

/** A valid 1x1 PNG. */
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

export type CoverFile = { name: string; mimeType: string; buffer: Buffer }

export const pngCover: CoverFile = { name: 'capa.png', mimeType: 'image/png', buffer: PNG_BYTES }

/** Picks a cover through the "Selecionar" button and the file chooser it opens. */
export async function pickCover(page: Page, file: CoverFile) {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Selecionar' }).click()
  await (await chooser).setFiles(file)
}

/** Fills every field of the project form (pt-BR labels). */
export async function fillProjectForm(
  page: Page,
  values: { name: string; clientName: string; startDate: string; endDate: string },
) {
  await page.getByLabel('Nome do projeto').fill(values.name)
  await page.getByLabel('Cliente').fill(values.clientName)
  await page.getByLabel('Data de Início').fill(values.startDate)
  await page.getByLabel('Data Final').fill(values.endDate)
}

/** Part names of a multipart body as Playwright recorded it. */
export function multipartFields(rawBody: string | null) {
  return [...(rawBody ?? '').matchAll(/; name="([^"]+)"/g)].map((match) => match[1])
}

/** Value of a text part of a multipart body. */
export function multipartValue(rawBody: string | null, name: string) {
  const match = new RegExp(`; name="${name}"\\r\\n\\r\\n([^\\r]*)\\r\\n`).exec(rawBody ?? '')

  return match?.[1]
}
