import type { Page } from '@playwright/test'
import type { ApiMock } from '../support/fixtures'
import type { TestProject } from '../support/projects'
import { errorResponse, expect, fieldError, test } from '../support/fixtures'
import {
  PNG_BYTES,
  PROJECTS_PATH,
  buildProject,
  buildProjects,
  isoDate,
  multipartFields,
  multipartValue,
  projectPath,
  projectResponse,
  projectsPage,
  ptBrUser,
} from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const COVER_URL = 'http://api.e2e.test/covers/7.png'

const saved = buildProject({
  id: '7',
  name: 'Projeto Iridium',
  clientName: 'Clicksign',
  startDate: isoDate(-1),
  endDate: isoDate(20),
  coverImageUrl: COVER_URL,
})

function saveButton(page: Page) {
  return page.getByRole('button', { name: 'Salvar projeto' })
}

function coverPreview(page: Page) {
  return page.getByRole('img', { name: 'Capa do projeto selecionada' })
}

async function openEdit(page: Page, api: ApiMock, project: TestProject = saved) {
  api.on('GET', projectPath(project.id), { body: projectResponse(project) })
  await page.goto(`/projects/${project.id}/edit`)
  await expect(page.getByLabel('Nome do projeto')).toHaveValue(project.name)
}

test.describe('Edit project', () => {
  test.beforeEach(async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })
    await page.route(COVER_URL, (route) =>
      route.fulfill({ contentType: 'image/png', body: PNG_BYTES }),
    )
  })

  test('loads the project into the form', async ({ page, api }) => {
    await openEdit(page, api)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Editar projeto')
    await expect(page.getByLabel('Cliente')).toHaveValue('Clicksign')
    await expect(page.getByLabel('Data de Início')).toHaveValue(saved.startDate)
    await expect(page.getByLabel('Data Final')).toHaveValue(saved.endDate)
    await expect(coverPreview(page)).toHaveAttribute('src', COVER_URL)
    await expect(page.getByRole('button', { name: 'Remover capa' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Selecionar' })).toHaveCount(0)
    await expect(saveButton(page)).toBeEnabled()
    expect(api.requestsTo('GET', projectPath('7'))).toHaveLength(1)
  })

  test('shows the not found page for a missing project', async ({ page, api }) => {
    api.on('GET', projectPath('404'), {
      status: 404,
      body: errorResponse('Projeto não encontrado'),
    })

    await page.goto('/projects/404/edit')

    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
    await expect(page.getByLabel('Nome do projeto')).toHaveCount(0)
  })

  test('trash on a saved cover removes it on save', async ({ page, api }) => {
    api.on('PATCH', projectPath('7'), {
      body: projectResponse({ ...saved, coverImageUrl: null }, 'Projeto atualizado com sucesso.'),
    })
    await openEdit(page, api)
    const requestsBefore = api.requests.length

    await page.getByRole('button', { name: 'Remover capa' }).click()

    await expect(coverPreview(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Selecionar' })).toBeVisible()
    expect(api.requests).toHaveLength(requestsBefore)

    await saveButton(page).click()

    await expect(page).toHaveURL('/projects')
    const rawBody = api.requestsTo('PATCH', projectPath('7'))[0]!.rawBody
    expect(multipartFields(rawBody)).toContain('remove_cover_image')
    expect(multipartFields(rawBody)).not.toContain('cover_image')
    expect(multipartValue(rawBody, 'remove_cover_image')).toBe('true')
  })

  test('accepts an unchanged past date and rejects a changed one', async ({ page, api }) => {
    await openEdit(page, api)
    const start = page.getByLabel('Data de Início')

    await start.focus()
    await page.getByLabel('Nome do projeto').focus()
    await expect(fieldError(page, 'startDate')).toBeHidden()
    await expect(saveButton(page)).toBeEnabled()

    await start.fill(isoDate(-2))
    await expect(fieldError(page, 'startDate')).toHaveText('A data não pode ser anterior a hoje')
    await expect(saveButton(page)).toBeDisabled()

    await start.fill(saved.startDate)
    await expect(fieldError(page, 'startDate')).toBeHidden()
    await expect(saveButton(page)).toBeEnabled()

    // "Not before start" applies to the unchanged end date too.
    const end = page.getByLabel('Data Final')
    await start.fill(isoDate(25))
    await end.focus()
    await page.getByLabel('Nome do projeto').focus()
    await expect(end).toHaveValue(saved.endDate)
    await expect(fieldError(page, 'startDate')).toBeHidden()
    await expect(fieldError(page, 'endDate')).toHaveText('A data final não pode ser anterior à data de início')
    await expect(saveButton(page)).toBeDisabled()

    await start.fill(isoDate(10))
    await expect(fieldError(page, 'endDate')).toBeHidden()
    await expect(saveButton(page)).toBeEnabled()
  })

  test('updates with PATCH multipart and returns to the list with the message', async ({
    page,
    api,
  }) => {
    api.on('PATCH', projectPath('7'), {
      body: projectResponse(
        { ...saved, name: 'Projeto Iridium 2' },
        'Projeto atualizado com sucesso.',
      ),
    })
    await openEdit(page, api)

    await page.getByLabel('Nome do projeto').fill('Projeto Iridium 2')
    await saveButton(page).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.locator('.notification-success')).toContainText(
      'Projeto atualizado com sucesso.',
    )
    const requests = api.requestsTo('PATCH', projectPath('7'))
    expect(requests).toHaveLength(1)
    const rawBody = requests[0]!.rawBody
    expect(multipartFields(rawBody)).toEqual(['name', 'client_name', 'start_date', 'end_date'])
    expect(multipartValue(rawBody, 'name')).toBe('Projeto Iridium 2')
    expect(multipartValue(rawBody, 'client_name')).toBe('Clicksign')
    expect(multipartValue(rawBody, 'start_date')).toBe(saved.startDate)
    expect(multipartValue(rawBody, 'end_date')).toBe(saved.endDate)
  })

  test('shows API validation errors under their fields', async ({ page, api }) => {
    api.on('PATCH', projectPath('7'), {
      status: 422,
      body: errorResponse('Erro de validação', {
        name: ['já está em uso'],
        start_date: ['não pode ser alterada'],
      }),
    })
    await openEdit(page, api)

    await page.getByLabel('Cliente').fill('Acme')
    await saveButton(page).click()

    await expect(fieldError(page, 'name')).toHaveText('já está em uso')
    await expect(fieldError(page, 'startDate')).toHaveText('não pode ser alterada')
    await expect(page).toHaveURL('/projects/7/edit')
    await expect(page.getByLabel('Cliente')).toHaveValue('Acme')
  })

  test('Voltar returns to the list without saving', async ({ page, api }) => {
    await openEdit(page, api)
    await page.getByLabel('Nome do projeto').fill('Outro nome')

    await page.getByRole('link', { name: 'Voltar' }).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (2)')
    expect(api.requestsTo('PATCH', projectPath('7'))).toHaveLength(0)
  })
})
