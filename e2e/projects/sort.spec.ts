import type { Page } from '@playwright/test'
import type { ApiMock } from '../support/fixtures'
import { expect, test } from '../support/fixtures'
import { PROJECTS_PATH, buildProject, projectsPage, ptBrUser } from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const SORT_LABELS = {
  name: 'Ordem alfabética',
  recent_start: 'Iniciados mais recentes',
  nearest_deadline: 'Prazo mais próximo',
} as const

// Each sort answers a different order so the screen shows which one the API applied.
const ORDER_BY_SORT: Record<string, string[]> = {
  name: ['Alfa', 'Beta', 'Gama'],
  recent_start: ['Gama', 'Alfa', 'Beta'],
  nearest_deadline: ['Beta', 'Gama', 'Alfa'],
}

function mockSortedList(api: ApiMock) {
  api.on('GET', PROJECTS_PATH, ({ query }) => {
    const names = ORDER_BY_SORT[query.get('sort') ?? ''] ?? []

    return {
      body: projectsPage(names.map((name, index) => buildProject({ id: String(index + 1), name }))),
    }
  })
}

function sortSelect(page: Page) {
  return page.getByRole('button', { name: 'Ordenar projetos' })
}

function cardNames(page: Page) {
  return page.getByRole('heading', { level: 2 })
}

function listRequests(api: ApiMock) {
  return api.requestsTo('GET', PROJECTS_PATH)
}

test.describe('Projects sort', () => {
  test.beforeEach(({ api }) => {
    api.signIn(ptBrUser)
    mockSortedList(api)
  })

  test('lists the three sort options', async ({ page }) => {
    await page.goto('/projects')
    await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.name!)

    await sortSelect(page).click()

    await expect(sortSelect(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('option')).toHaveText([
      'Ordem alfabética',
      'Iniciados mais recentes',
      'Prazo mais próximo',
    ])
  })

  test('reloads from page 1 with the picked sort and closes the select', async ({ page, api }) => {
    await page.goto('/projects')
    await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.name!)

    for (const sort of ['recent_start', 'nearest_deadline', 'name'] as const) {
      const requestsBefore = listRequests(api).length

      await sortSelect(page).click()
      await page.getByRole('option', { name: SORT_LABELS[sort] }).click()

      await expect(page.getByRole('listbox')).toHaveCount(0)
      await expect(sortSelect(page)).toHaveText(SORT_LABELS[sort])
      await expect(page).toHaveURL(`/projects?sort=${sort}`)
      await expect(cardNames(page)).toHaveText(ORDER_BY_SORT[sort]!)
      const request = listRequests(api).at(-1)!
      expect(listRequests(api)).toHaveLength(requestsBefore + 1)
      expect(request.query.get('sort')).toBe(sort)
      expect(request.query.has('after')).toBe(false)
    }
  })

  test('uses name when the URL has no valid sort', async ({ page, api }) => {
    for (const path of ['/projects', '/projects?sort=popularity']) {
      await page.goto(path)

      await expect(sortSelect(page)).toHaveText('Ordem alfabética')
      await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.name!)
      expect(listRequests(api).at(-1)!.query.get('sort')).toBe('name')
    }
  })

  test('keeps the sort from the URL after reload', async ({ page, api }) => {
    await page.goto('/projects')
    await sortSelect(page).click()
    await page.getByRole('option', { name: 'Iniciados mais recentes' }).click()
    await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.recent_start!)

    await page.reload()

    await expect(page).toHaveURL('/projects?sort=recent_start')
    await expect(sortSelect(page)).toHaveText('Iniciados mais recentes')
    await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.recent_start!)
    expect(listRequests(api).at(-1)!.query.get('sort')).toBe('recent_start')
  })

  test('closes on outside click and Escape without changing the order', async ({ page, api }) => {
    await page.goto('/projects')
    await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.name!)
    const requestsBefore = listRequests(api).length

    await sortSelect(page).click()
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.getByRole('heading', { level: 1 }).click()
    await expect(page.getByRole('listbox')).toHaveCount(0)

    await sortSelect(page).click()
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toHaveCount(0)

    await expect(sortSelect(page)).toHaveText('Ordem alfabética')
    await expect(cardNames(page)).toHaveText(ORDER_BY_SORT.name!)
    await expect(page).toHaveURL('/projects')
    expect(listRequests(api)).toHaveLength(requestsBefore)
  })
})
