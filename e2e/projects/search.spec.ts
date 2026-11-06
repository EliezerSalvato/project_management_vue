import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import {
  PROJECTS_PATH,
  buildProject,
  buildProjects,
  favoritePath,
  projectResponse,
  projectsPage,
  ptBrUser,
} from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const RECENT_KEY = `projects.recentSearches.${ptBrUser.id}`

function searchInput(page: Page) {
  return page.getByRole('textbox', { name: 'Buscar projetos' })
}

function recentList(page: Page) {
  return page.getByRole('list', { name: 'Pesquisas recentes' })
}

async function storedSearches(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RECENT_KEY)
}

async function openList(page: Page, recent?: string[]) {
  await page.goto('/projects')
  await expect(page.getByRole('article')).toHaveCount(2)

  if (recent) {
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key!, value!),
      [RECENT_KEY, JSON.stringify(recent)],
    )
    await page.reload()
    await expect(page.getByRole('article')).toHaveCount(2)
  }
}

async function openSearchBar(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'Buscar' }).click()
  await expect(searchInput(page)).toBeVisible()
}

test.describe('Project search', () => {
  test.beforeEach(async ({ api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })
  })

  test('opens the focused search bar with the placeholder', async ({ page }) => {
    await openList(page)
    await expect(searchInput(page)).toHaveCount(0)

    await openSearchBar(page)

    await expect(searchInput(page)).toBeFocused()
    await expect(searchInput(page)).toHaveAttribute('placeholder', 'Digite o nome do projeto ou o nome do cliente...')
    await expect(searchInput(page)).toHaveValue('')
    await expect(page.getByRole('banner')).toHaveCount(0)
  })

  test('Enter with 3 or more characters opens the result page and saves the term', async ({
    page,
  }) => {
    await openList(page)
    await openSearchBar(page)

    await searchInput(page).fill('  Projet  ')
    await searchInput(page).press('Enter')

    await expect(page).toHaveURL('/projects/search?q=Projet')
    expect(await storedSearches(page)).toEqual(['Projet'])
  })

  test('Enter with fewer than 3 characters does nothing', async ({ page, api }) => {
    await openList(page)
    await openSearchBar(page)
    const requestsBefore = api.requests.length

    await searchInput(page).fill(' ab ')
    await searchInput(page).press('Enter')
    await page.waitForTimeout(300)

    await expect(page).toHaveURL('/projects')
    await expect(searchInput(page)).toBeVisible()
    expect(api.requests).toHaveLength(requestsBefore)
    expect(await storedSearches(page)).toBeNull()
  })

  test('Escape and outside click close the search bar', async ({ page }) => {
    await openList(page)
    await openSearchBar(page)

    await page.keyboard.press('Escape')

    await expect(searchInput(page)).toHaveCount(0)
    await expect(page.getByRole('banner').getByRole('button', { name: 'Buscar' })).toBeVisible()

    await openSearchBar(page)
    await page.getByRole('heading', { level: 1 }).click()

    await expect(searchInput(page)).toHaveCount(0)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page).toHaveURL('/projects')
  })
})

test.describe('Project search', () => {
  test.beforeEach(async ({ api }) => {
    api.signIn(ptBrUser)
  })

  test('result page lists the API results for the term', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage([
        buildProject({ id: '1', name: 'Projeto 01', clientName: 'Clicksign' }),
        buildProject({ id: '2', name: 'Site novo', clientName: 'Projetos SA' }),
      ]),
    })

    await page.goto('/projects/search?q=Projet')

    await expect(page.getByRole('article')).toHaveCount(2)
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Projeto 01', 'Site novo'])
    await expect(searchInput(page)).toHaveValue('Projet')
    await expect(page.getByRole('link', { name: 'Voltar' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resultado da busca')
    const requests = api.requestsTo('GET', PROJECTS_PATH)
    expect(requests).toHaveLength(1)
    expect(requests[0]!.query.get('search')).toBe('Projet')
    expect(requests[0]!.query.has('after')).toBe(false)
  })

  test('redirects a search shorter than 3 characters to the list', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })

    for (const query of ['?q=ab', '?q=%20ab%20', '?q=', '']) {
      await page.goto(`/projects/search${query}`)

      await expect(page).toHaveURL('/projects')
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Resultado da busca')
      await expect(page.getByRole('article')).toHaveCount(2)
    }

    const searches = api
      .requestsTo('GET', PROJECTS_PATH)
      .filter((request) => request.query.has('search'))
    expect(searches).toHaveLength(0)
  })

  test('highlights the term in result names and client names', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage([
        buildProject({ id: '1', name: 'Projeto 01' }),
        buildProject({ id: '2', name: 'Gestão de PROJÉTOS e projetos' }),
        buildProject({ id: '3', name: 'Sem relação', clientName: 'Projeto Cliente' }),
      ]),
    })

    await page.goto('/projects/search?q=projeto')

    const first = page.getByRole('article', { name: 'Projeto 01' })
    await expect(first.getByRole('heading')).toHaveText('Projeto 01')
    await expect(first.locator('mark')).toHaveText(['Projeto'])
    await expect(first.locator('mark')).toHaveCSS('background-color', 'rgb(255, 178, 61)')
    const second = page.getByRole('article', { name: 'Gestão de PROJÉTOS e projetos' })
    await expect(second.locator('mark')).toHaveText(['PROJÉTO', 'projeto'])
    await expect(second.getByRole('heading')).toHaveText('Gestão de PROJÉTOS e projetos')
    const third = page.getByRole('article', { name: 'Sem relação' })
    await expect(third.getByRole('heading').locator('mark')).toHaveCount(0)
    await expect(third.locator('mark')).toHaveText(['Projeto'])
    await expect(third.getByText('Projeto Cliente')).toBeVisible()
  })

  test('shows the no results message when nothing matches', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/projects/search?q=inexistente')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resultado da busca')
    await expect(page.getByText('Nenhum projeto encontrado')).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(0)
  })

  test('result cards support favorite, menu and infinite scroll', async ({ page, api }) => {
    const projects = buildProjects(3).map((project, index) => ({
      ...project,
      name: `Projeto 0${index + 1}`,
    }))
    api.on('GET', PROJECTS_PATH, (request) => {
      const after = request.query.get('after')
      const slice = after ? projects.slice(2) : projects.slice(0, 2)

      return { body: projectsPage(slice, { next: after ? null : '2', count: 3, limit: 2 }) }
    })
    api.on('POST', favoritePath('1'), {
      body: projectResponse({ ...projects[0]!, favorite: true }),
    })
    await page.setViewportSize({ width: 1280, height: 600 })

    await page.goto('/projects/search?q=Projeto')
    await expect(page.getByRole('article')).toHaveCount(2)

    const first = page.getByRole('article', { name: 'Projeto 01', exact: true })
    await first.getByRole('button', { name: 'Favorito' }).click()
    await expect(first.getByRole('button', { name: 'Favorito' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(api.requestsTo('POST', favoritePath('1'))).toHaveLength(1)

    await first.getByRole('button', { name: 'Opções' }).click()
    await expect(first.getByRole('menuitem')).toHaveText(['Editar', 'Remover'])
    await page.keyboard.press('Escape')

    await page.mouse.wheel(0, 3000)
    await expect(page.getByRole('article')).toHaveCount(3)
    const requests = api.requestsTo('GET', PROJECTS_PATH)
    expect(requests.map((request) => request.query.get('after'))).toEqual([null, '2'])
    expect(requests.every((request) => request.query.get('search') === 'Projeto')).toBe(true)
  })

  test('Voltar returns to the list', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })
    await page.goto('/projects/search?q=Projet')
    await expect(page.getByRole('article')).toHaveCount(2)

    await page.getByRole('link', { name: 'Voltar' }).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (2)')
  })
})

test.describe('Recent searches', () => {
  test.beforeEach(async ({ api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })
  })

  test('lists up to 5 recent searches newest first', async ({ page }) => {
    // Seven stored terms: only the five newest show.
    await openList(page, [
      'Projeto 7',
      'Projeto 6',
      'Projeto 5',
      'Projeto 4',
      'Projeto 3',
      'Projeto 2',
      'Projeto 1',
    ])
    await openSearchBar(page)

    const items = recentList(page).getByRole('listitem')
    await expect(items).toHaveText([
      'Projeto 7',
      'Projeto 6',
      'Projeto 5',
      'Projeto 4',
      'Projeto 3',
    ])
    for (const item of await items.all()) {
      await expect(item.getByTestId('history-icon')).toBeVisible()
      await expect(
        item.getByRole('button', { name: /^Remover .* das pesquisas recentes$/ }),
      ).toBeVisible()
    }

    // A sixth search pushes the oldest out and goes to the top.
    await searchInput(page).fill('Clicksign')
    await searchInput(page).press('Enter')
    await expect(page).toHaveURL('/projects/search?q=Clicksign')
    expect(await storedSearches(page)).toEqual([
      'Clicksign',
      'Projeto 7',
      'Projeto 6',
      'Projeto 5',
      'Projeto 4',
    ])
  })

  test('clicking a recent search runs it', async ({ page }) => {
    await openList(page, ['Projeto 2', 'Acme'])
    await openSearchBar(page)

    await recentList(page).getByRole('button', { name: 'Acme', exact: true }).click()

    await expect(page).toHaveURL('/projects/search?q=Acme')
    expect(await storedSearches(page)).toEqual(['Acme', 'Projeto 2'])
  })

  test('X removes the search and keeps the bar open', async ({ page }) => {
    await openList(page, ['Projeto 2', 'Acme', 'Clicksign'])
    await openSearchBar(page)

    await recentList(page)
      .getByRole('button', { name: 'Remover Acme das pesquisas recentes' })
      .click()

    await expect(recentList(page).getByRole('listitem')).toHaveText(['Projeto 2', 'Clicksign'])
    await expect(searchInput(page)).toBeVisible()
    await expect(page).toHaveURL('/projects')
    expect(await storedSearches(page)).toEqual(['Projeto 2', 'Clicksign'])
  })
})
