import type { Page } from '@playwright/test'
import { deferred, errorResponse, expect, fieldError, test } from '../support/fixtures'
import {
  PNG_BYTES,
  PROJECTS_PATH,
  buildProject,
  buildProjects,
  fillProjectForm,
  isoDate,
  multipartFields,
  multipartValue,
  pickCover,
  pngCover,
  projectResponse,
  projectsPage,
  ptBrUser,
} from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const TWO_WORDS = 'Por favor, digite ao menos duas palavras'
const ONE_WORD = 'Por favor, digite ao menos uma palavra'
const INVALID_DATE = 'Selecione uma data válida'
const BEFORE_START = 'A data final não pode ser anterior à data de início'
const INVALID_COVER = 'Selecione uma imagem .jpg ou .png de até 5 MB'

function saveButton(page: Page) {
  return page.getByRole('button', { name: 'Salvar projeto' })
}

const validValues = () => ({
  name: 'Projeto Iridium',
  clientName: 'Clicksign',
  startDate: isoDate(1),
  endDate: isoDate(30),
})

test.describe('New project', () => {
  test.beforeEach(async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })

    await page.goto('/projects/new')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Novo projeto')
  })

  test('shows the empty form with the save button disabled', async ({ page }) => {
    for (const label of ['Nome do projeto', 'Cliente', 'Data de Início', 'Data Final']) {
      const field = page.getByLabel(label)
      await expect(field).toHaveValue('')
      await expect(page.locator('label', { hasText: label })).toContainText('(Obrigatório)')
    }
    await expect(page.getByText('Capa do projeto')).toBeVisible()
    await expect(page.getByText('Escolha uma imagem .jpg ou .png no seu dispositivo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Selecionar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar' })).toBeVisible()
    await expect(saveButton(page)).toBeDisabled()
    await expect(page.locator('.form-help-error:visible')).toHaveCount(0)
  })

  test('shows the two-words error on the name after blur', async ({ page }) => {
    await page.getByLabel('Nome do projeto').fill('  Iridium  ')
    await expect(fieldError(page, 'name')).toBeHidden()

    await page.getByLabel('Cliente').focus()

    await expect(fieldError(page, 'name')).toHaveText(TWO_WORDS)
    await expect(page.getByLabel('Nome do projeto')).toHaveClass(/form-input-error/)

    await page.getByLabel('Nome do projeto').fill('Projeto Iridium')
    await expect(fieldError(page, 'name')).toBeHidden()
  })

  test('shows the one-word error on a blank client after blur', async ({ page }) => {
    await page.getByLabel('Cliente').fill('   ')
    await page.getByLabel('Nome do projeto').focus()

    await expect(fieldError(page, 'clientName')).toHaveText(ONE_WORD)
    await expect(page.getByLabel('Cliente')).toHaveClass(/form-input-error/)

    await page.getByLabel('Cliente').fill('a')
    await expect(fieldError(page, 'clientName')).toBeHidden()

    await page.getByLabel('Cliente').fill('Iridium')
    await expect(fieldError(page, 'clientName')).toBeHidden()
  })

  test('accepts a start date before today', async ({ page }) => {
    const start = page.getByLabel('Data de Início')

    await start.focus()
    await page.getByLabel('Nome do projeto').focus()
    await expect(fieldError(page, 'startDate')).toHaveText(INVALID_DATE)
    await expect(start).toHaveClass(/form-input-error/)

    await start.fill(isoDate(-1))
    await expect(fieldError(page, 'startDate')).toBeHidden()
  })

  test('shows the date error on an end date before the start date', async ({ page }) => {
    await page.getByLabel('Data de Início').fill(isoDate(10))
    await page.getByLabel('Data Final').fill(isoDate(5))
    await page.getByLabel('Nome do projeto').focus()

    await expect(fieldError(page, 'endDate')).toHaveText(BEFORE_START)
    await expect(fieldError(page, 'startDate')).toBeHidden()

    await page.getByLabel('Data Final').fill(isoDate(-1))
    await expect(fieldError(page, 'endDate')).toHaveText(BEFORE_START)

    await page.getByLabel('Data Final').fill(isoDate(10))
    await expect(fieldError(page, 'endDate')).toBeHidden()
  })

  test('limits name and client to 255 characters', async ({ page }) => {
    const long = 'a'.repeat(260)

    for (const label of ['Nome do projeto', 'Cliente']) {
      const field = page.getByLabel(label)
      await expect(field).toHaveAttribute('maxlength', '255')
      await field.click()
      await page.keyboard.insertText(long)
      await expect(field).toHaveValue('a'.repeat(255))
    }
  })

  test('keeps save disabled while any field is invalid', async ({ page }) => {
    const values = validValues()
    await fillProjectForm(page, values)
    await expect(saveButton(page)).toBeEnabled()

    const invalid: [string, string, string][] = [
      ['Nome do projeto', 'Iridium', values.name],
      ['Cliente', ' ', values.clientName],
      ['Data de Início', '', values.startDate],
      ['Data Final', isoDate(-1), values.endDate],
    ]
    for (const [label, wrong, right] of invalid) {
      await page.getByLabel(label).fill(wrong)
      await expect(saveButton(page)).toBeDisabled()
      await page.getByLabel(label).fill(right)
      await expect(saveButton(page)).toBeEnabled()
    }
  })

  test('file picker accepts only jpg and png', async ({ page }) => {
    await expect(page.getByLabel('Capa do projeto')).toHaveAttribute('accept', '.jpg,.jpeg,.png')

    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Selecionar' }).click()

    expect((await chooser).isMultiple()).toBe(false)
  })

  test('shows the picked image as the cover preview', async ({ page }) => {
    await pickCover(page, pngCover)

    const preview = page.getByRole('img', { name: 'Capa do projeto selecionada' })
    await expect(preview).toBeVisible()
    await expect(preview).toHaveAttribute('src', /^blob:/)
    expect(await preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1)
    await expect(page.getByRole('button', { name: 'Remover capa' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Selecionar' })).toHaveCount(0)
  })

  test('rejects a cover that is not jpg or png or is over 5 MB', async ({ page }) => {
    await pickCover(page, { name: 'capa.gif', mimeType: 'image/gif', buffer: PNG_BYTES })

    await expect(page.getByText(INVALID_COVER)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Selecionar' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Capa do projeto selecionada' })).toHaveCount(0)

    await pickCover(page, pngCover)
    await expect(page.getByText(INVALID_COVER)).toHaveCount(0)
    await page.getByRole('button', { name: 'Remover capa' }).click()

    const tooBig = Buffer.concat([PNG_BYTES, Buffer.alloc(5 * 1024 * 1024)])
    await pickCover(page, { name: 'grande.png', mimeType: 'image/png', buffer: tooBig })

    await expect(page.getByText(INVALID_COVER)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Selecionar' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Capa do projeto selecionada' })).toHaveCount(0)
  })

  test('trash discards a picked cover', async ({ page }) => {
    await pickCover(page, pngCover)
    await expect(page.getByRole('img', { name: 'Capa do projeto selecionada' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover capa' }).click()

    await expect(page.getByRole('img', { name: 'Capa do projeto selecionada' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Selecionar' })).toBeVisible()
    await expect(page.getByText('Escolha uma imagem .jpg ou .png no seu dispositivo')).toBeVisible()
  })

  test('Voltar returns to the list without saving', async ({ page, api }) => {
    await fillProjectForm(page, validValues())

    await page.getByRole('link', { name: 'Voltar' }).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (2)')
    expect(api.requestsTo('POST', PROJECTS_PATH)).toHaveLength(0)
  })

  test('creates the project as multipart and returns to the list with the message', async ({
    page,
    api,
  }) => {
    const values = validValues()
    const created = buildProject({ id: '99', ...values })
    api.on('POST', PROJECTS_PATH, {
      status: 201,
      body: projectResponse(created, 'Projeto criado com sucesso.'),
      sideEffect: () =>
        api.on('GET', PROJECTS_PATH, { body: projectsPage([...buildProjects(2), created]) }),
    })
    await fillProjectForm(page, values)
    await pickCover(page, pngCover)

    await saveButton(page).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.locator('.notification-success')).toContainText('Projeto criado com sucesso.')
    await expect(page.getByRole('article', { name: 'Projeto Iridium' })).toBeVisible()
    const requests = api.requestsTo('POST', PROJECTS_PATH)
    expect(requests).toHaveLength(1)
    const rawBody = requests[0]!.rawBody
    expect(requests[0]!.body).toBeNull()
    expect(multipartFields(rawBody)).toEqual([
      'name',
      'client_name',
      'start_date',
      'end_date',
      'cover_image',
    ])
    expect(multipartValue(rawBody, 'name')).toBe(values.name)
    expect(multipartValue(rawBody, 'client_name')).toBe(values.clientName)
    expect(multipartValue(rawBody, 'start_date')).toBe(values.startDate)
    expect(multipartValue(rawBody, 'end_date')).toBe(values.endDate)
    expect(rawBody).toContain('name="cover_image"; filename="capa.png"')
    expect(rawBody).toContain('Content-Type: image/png')
  })

  test('disables save while the request is in flight', async ({ page, api }) => {
    const gate = deferred()
    api.on('POST', PROJECTS_PATH, async () => {
      await gate.promise
      return { status: 201, body: projectResponse(buildProject(), 'Projeto criado com sucesso.') }
    })
    await fillProjectForm(page, validValues())

    await saveButton(page).click()

    await expect(saveButton(page)).toBeDisabled()
    await expect(saveButton(page)).toHaveClass(/btn-loading/)

    gate.resolve()

    await expect(page).toHaveURL('/projects')
  })

  test('shows API validation errors under their fields', async ({ page, api }) => {
    api.on('POST', PROJECTS_PATH, {
      status: 422,
      body: errorResponse('Erro de validação', {
        name: ['já está em uso'],
        client_name: ['é muito longo'],
        end_date: ['deve ser depois da data de início'],
      }),
    })
    const values = validValues()
    await fillProjectForm(page, values)

    await saveButton(page).click()

    await expect(fieldError(page, 'name')).toHaveText('já está em uso')
    await expect(fieldError(page, 'clientName')).toHaveText('é muito longo')
    await expect(fieldError(page, 'endDate')).toHaveText('deve ser depois da data de início')
    await expect(page).toHaveURL('/projects/new')
    await expect(page.getByLabel('Nome do projeto')).toHaveValue(values.name)
    await expect(page.getByLabel('Cliente')).toHaveValue(values.clientName)
    await expect(page.getByLabel('Data de Início')).toHaveValue(values.startDate)
    await expect(page.getByLabel('Data Final')).toHaveValue(values.endDate)
    await expect(saveButton(page)).toBeEnabled()
  })

  test('sends one request on double click', async ({ page, api }) => {
    const gate = deferred()
    api.on('POST', PROJECTS_PATH, async () => {
      await gate.promise
      return { status: 201, body: projectResponse(buildProject(), 'Projeto criado com sucesso.') }
    })
    await fillProjectForm(page, validValues())

    await saveButton(page).dblclick()
    await page.waitForTimeout(300)
    gate.resolve()

    await expect(page).toHaveURL('/projects')
    expect(api.requestsTo('POST', PROJECTS_PATH)).toHaveLength(1)
  })
})
