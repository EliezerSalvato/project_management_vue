import type { Page } from '@playwright/test'
import { deferred, errorResponse, expect, test } from '../support/fixtures'
import {
  PROJECTS_PATH,
  buildProject,
  favoritePath,
  projectResponse,
  projectsPage,
  ptBrUser,
} from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const plain = buildProject({ id: '1', name: 'Projeto 01', favorite: false })
const starred = buildProject({ id: '2', name: 'Projeto 02', favorite: true })

function star(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true }).getByRole('button', { name: 'Favorito' })
}

async function expectStar(page: Page, name: string, filled: boolean) {
  const button = star(page, name)

  await expect(button).toHaveAttribute('aria-pressed', String(filled))
  // The filled star is the orange (#FFB23D) icon; the empty one is a white outline.
  const icon = expect(button.locator('img'))
  if (filled) await icon.toHaveAttribute('src', /FFB23D/i)
  else await icon.not.toHaveAttribute('src', /FFB23D/i)
}

test.describe('Project favorite', () => {
  test.beforeEach(async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([plain, starred]) })

    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(2)
  })

  test('favorites a project with POST and fills the star', async ({ page, api }) => {
    api.on('POST', favoritePath('1'), { body: projectResponse({ ...plain, favorite: true }) })
    await expectStar(page, 'Projeto 01', false)

    await star(page, 'Projeto 01').click()

    await expectStar(page, 'Projeto 01', true)
    expect(api.requestsTo('POST', favoritePath('1'))).toHaveLength(1)
    expect(api.requestsTo('DELETE', favoritePath('1'))).toHaveLength(0)
    await expectStar(page, 'Projeto 02', true)
  })

  test('unfavorites a project with DELETE and empties the star', async ({ page, api }) => {
    api.on('DELETE', favoritePath('2'), { body: projectResponse({ ...starred, favorite: false }) })
    await expectStar(page, 'Projeto 02', true)

    await star(page, 'Projeto 02').click()

    await expectStar(page, 'Projeto 02', false)
    expect(api.requestsTo('DELETE', favoritePath('2'))).toHaveLength(1)
    expect(api.requestsTo('POST', favoritePath('2'))).toHaveLength(0)
  })

  test('keeps the star and shows the error when the request fails', async ({ page, api }) => {
    api.on('POST', favoritePath('1'), {
      status: 500,
      body: errorResponse('Não foi possível favoritar o projeto'),
    })

    await star(page, 'Projeto 01').click()

    await expect(page.locator('.notification-danger')).toContainText(
      'Não foi possível favoritar o projeto',
    )
    await expectStar(page, 'Projeto 01', false)
  })

  test('ignores clicks while the request is in flight', async ({ page, api }) => {
    const response = deferred()
    api.on('POST', favoritePath('1'), async () => {
      await response.promise

      return { body: projectResponse({ ...plain, favorite: true }) }
    })

    await star(page, 'Projeto 01').click()
    await expect.poll(() => api.requestsTo('POST', favoritePath('1')).length).toBe(1)
    await expect(star(page, 'Projeto 01')).toBeDisabled()
    await star(page, 'Projeto 01').click({ force: true })
    await page.waitForTimeout(300)

    expect(api.requestsTo('POST', favoritePath('1'))).toHaveLength(1)
    expect(api.requestsTo('DELETE', favoritePath('1'))).toHaveLength(0)

    response.resolve()

    await expectStar(page, 'Projeto 01', true)
    await expect(star(page, 'Projeto 01')).toBeEnabled()
    expect(api.requestsTo('POST', favoritePath('1'))).toHaveLength(1)
  })
})
