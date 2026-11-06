import type { Page } from '@playwright/test'
import type { ApiMock } from '../support/fixtures'
import { deferred, errorResponse, expect, messageResponse, test } from '../support/fixtures'
import {
  PROJECTS_PATH,
  buildProject,
  projectPath,
  projectsPage,
  ptBrUser,
} from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const first = buildProject({ id: '1', name: 'Projeto 01' })
const second = buildProject({ id: '2', name: 'Projeto 02' })

function card(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true })
}

async function openRemoveModal(page: Page, name: string) {
  await card(page, name).getByRole('button', { name: 'Opções' }).click()
  await card(page, name).getByRole('menuitem', { name: 'Remover' }).click()

  return page.getByRole('dialog', { name: 'Remover projeto' })
}

test.describe('Remove project', () => {
  test.beforeEach(async ({ api }) => {
    api.signIn(ptBrUser)
  })

  async function openList(
    page: Page,
    api: ApiMock,
    projects = [first, second],
  ) {
    api.on('GET', PROJECTS_PATH, { body: projectsPage(projects) })
    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(projects.length)
  }

  test('opens the modal with the project name', async ({ page, api }) => {
    await openList(page, api)

    const modal = await openRemoveModal(page, 'Projeto 02')

    await expect(modal).toBeVisible()
    await expect(modal.getByRole('heading')).toHaveText('Remover projeto')
    await expect(modal).toContainText('Essa ação removerá definitivamente o projeto:')
    await expect(modal.locator('.modal-confirm-subject')).toHaveText('Projeto 02')
    await expect(modal.getByRole('button')).toHaveText(['Cancelar', 'Confirmar'])
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('Cancelar, backdrop and Escape close the modal and keep the project', async ({
    page,
    api,
  }) => {
    await openList(page, api)

    let modal = await openRemoveModal(page, 'Projeto 01')
    await modal.getByRole('button', { name: 'Cancelar' }).click()
    await expect(modal).toHaveCount(0)

    modal = await openRemoveModal(page, 'Projeto 01')
    await page.getByTestId('modal-backdrop').click({ position: { x: 10, y: 10 } })
    await expect(modal).toHaveCount(0)

    modal = await openRemoveModal(page, 'Projeto 01')
    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)

    await expect(page.getByRole('article')).toHaveCount(2)
    await expect(card(page, 'Projeto 01')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (2)')
    expect(api.requestsTo('DELETE', projectPath('1'))).toHaveLength(0)
  })

  test('Confirmar deletes, removes the card, decrements the count and shows the message', async ({
    page,
    api,
  }) => {
    await openList(page, api)
    api.on('DELETE', projectPath('2'), { body: messageResponse('Projeto removido com sucesso.') })

    const modal = await openRemoveModal(page, 'Projeto 02')
    await modal.getByRole('button', { name: 'Confirmar' }).click()

    await expect(modal).toHaveCount(0)
    await expect(card(page, 'Projeto 02')).toHaveCount(0)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(card(page, 'Projeto 01')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (1)')
    await expect(page.locator('.notification-success')).toContainText(
      'Projeto removido com sucesso.',
    )
    expect(api.requestsTo('DELETE', projectPath('2'))).toHaveLength(1)
  })

  test('disables both buttons while the request is in flight', async ({ page, api }) => {
    await openList(page, api)
    const gate = deferred()
    api.on('DELETE', projectPath('1'), async () => {
      await gate.promise
      return { body: messageResponse('Projeto removido com sucesso.') }
    })

    const modal = await openRemoveModal(page, 'Projeto 01')
    await modal.getByRole('button', { name: 'Confirmar' }).click()

    await expect(modal.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
    await expect(modal.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(modal).toBeVisible()

    gate.resolve()

    await expect(modal).toHaveCount(0)
    await expect(card(page, 'Projeto 01')).toHaveCount(0)
    expect(api.requestsTo('DELETE', projectPath('1'))).toHaveLength(1)
  })

  test('keeps the card and shows the error when delete fails', async ({ page, api }) => {
    await openList(page, api)
    api.on('DELETE', projectPath('1'), {
      status: 500,
      body: errorResponse('Não foi possível remover o projeto.'),
    })

    const modal = await openRemoveModal(page, 'Projeto 01')
    await modal.getByRole('button', { name: 'Confirmar' }).click()

    await expect(modal).toHaveCount(0)
    await expect(page.locator('.notification-danger')).toContainText(
      'Não foi possível remover o projeto.',
    )
    await expect(card(page, 'Projeto 01')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (2)')
  })

  test('shows the empty state after removing the last project', async ({ page, api }) => {
    await openList(page, api, [first])
    api.on('DELETE', projectPath('1'), { body: messageResponse('Projeto removido com sucesso.') })

    const modal = await openRemoveModal(page, 'Projeto 01')
    await modal.getByRole('button', { name: 'Confirmar' }).click()

    await expect(page.getByRole('heading', { name: 'Nenhum projeto' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Novo projeto' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(0)
  })
})
