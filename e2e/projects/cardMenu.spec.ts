import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import { PROJECTS_PATH, buildProject, projectsPage, ptBrUser } from '../support/projects'

test.use({ appLocale: 'pt-BR' })

function card(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true })
}

function menuButton(page: Page, name: string) {
  return card(page, name).getByRole('button', { name: 'Opções' })
}

test.describe('Project card menu', () => {
  test.beforeEach(async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage([
        buildProject({ id: '11', name: 'Projeto 01' }),
        buildProject({ id: '12', name: 'Projeto 02' }),
      ]),
    })

    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(2)
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('opens Editar and Remover and closes other menus', async ({ page }) => {
    await menuButton(page, 'Projeto 01').click()

    const firstMenu = card(page, 'Projeto 01').getByRole('menu')
    await expect(firstMenu).toBeVisible()
    await expect(firstMenu.getByRole('menuitem')).toHaveText(['Editar', 'Remover'])
    await expect(menuButton(page, 'Projeto 01')).toHaveAttribute('aria-expanded', 'true')

    await menuButton(page, 'Projeto 02').click()

    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect(card(page, 'Projeto 02').getByRole('menu')).toBeVisible()
    await expect(firstMenu).toHaveCount(0)
    await expect(menuButton(page, 'Projeto 01')).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes on outside click and Escape', async ({ page }) => {
    await menuButton(page, 'Projeto 01').click()
    await expect(page.getByRole('menu')).toBeVisible()

    await page.getByRole('heading', { level: 1 }).click()
    await expect(page.getByRole('menu')).toHaveCount(0)

    await menuButton(page, 'Projeto 01').click()
    await expect(page.getByRole('menu')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page).toHaveURL('/projects')
  })

  test('Editar navigates to the edit page', async ({ page }) => {
    await menuButton(page, 'Projeto 02').click()

    await card(page, 'Projeto 02').getByRole('menuitem', { name: 'Editar' }).click()

    await expect(page).toHaveURL('/projects/12/edit')
  })
})
