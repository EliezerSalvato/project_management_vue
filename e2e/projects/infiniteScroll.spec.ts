import type { ApiMock } from '../support/fixtures'
import { deferred, expect, test } from '../support/fixtures'
import { PROJECTS_PATH, buildProjects, projectsPage, ptBrUser } from '../support/projects'

test.use({ appLocale: 'pt-BR' })

const ALL_PROJECTS = buildProjects(25)
const LIMIT = 20

/** First page without `after`; the second after the 20th project, as the API's cursor. */
function pageAfter(after: string | null) {
  const offset = after ? ALL_PROJECTS.findIndex((project) => project.id === after) + 1 : 0
  const items = ALL_PROJECTS.slice(offset, offset + LIMIT)
  const next = offset + LIMIT < ALL_PROJECTS.length ? items[items.length - 1]!.id : null

  return projectsPage(items, { next, count: ALL_PROJECTS.length, limit: LIMIT })
}

function listRequests(api: ApiMock) {
  return api.requestsTo('GET', PROJECTS_PATH)
}

test.describe('Projects infinite scroll', () => {
  test.beforeEach(({ api }) => {
    api.signIn(ptBrUser)
  })

  test('loads and appends the next page at the end of the grid', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, ({ query }) => ({ body: pageAfter(query.get('after')) }))

    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(20)
    await page.waitForTimeout(300)
    expect(listRequests(api)).toHaveLength(1)

    await page.mouse.wheel(0, 10_000)

    await expect(page.getByRole('article')).toHaveCount(25)
    const names = await page.getByRole('heading', { level: 2 }).allTextContents()
    expect(names).toEqual(ALL_PROJECTS.map((project) => project.name))
    expect(listRequests(api).map((request) => request.query.get('after'))).toEqual([null, '20'])
  })

  test('shows the loading indicator while the next page loads', async ({ page, api }) => {
    const secondPage = deferred()
    api.on('GET', PROJECTS_PATH, async ({ query }) => {
      const after = query.get('after')
      if (after) await secondPage.promise

      return { body: pageAfter(after) }
    })

    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(20)
    await expect(page.locator('.loading-dots')).toHaveCount(0)

    await page.mouse.wheel(0, 10_000)

    const loading = page.locator('.loading-dots')
    await expect(loading).toBeVisible()
    // Both rects in one frame: separate reads race the still-settling wheel scroll.
    const { gridBottom, loadingTop } = await page.evaluate(() => ({
      gridBottom: document.querySelector('.project-grid')!.getBoundingClientRect().bottom,
      loadingTop: document.querySelector('.loading-dots')!.getBoundingClientRect().top,
    }))
    expect(loadingTop).toBeGreaterThanOrEqual(gridBottom)

    const secondPageRequests = () =>
      listRequests(api).filter((request) => request.query.get('after') === '20')
    await expect.poll(() => secondPageRequests().length).toBe(1)

    await page.mouse.wheel(0, -200)
    await page.mouse.wheel(0, 10_000)
    // Give a duplicate request time to be sent before counting.
    await page.waitForTimeout(500)
    expect(secondPageRequests()).toHaveLength(1)

    secondPage.resolve()

    await expect(page.getByRole('article')).toHaveCount(25)
    await expect(loading).toHaveCount(0)
  })

  test('stops requesting after the last page', async ({ page, api }) => {
    api.on('GET', PROJECTS_PATH, ({ query }) => ({ body: pageAfter(query.get('after')) }))

    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(20)
    await page.mouse.wheel(0, 10_000)
    await expect(page.getByRole('article')).toHaveCount(25)

    for (let attempt = 0; attempt < 3; attempt++) {
      await page.mouse.wheel(0, -500)
      await page.mouse.wheel(0, 10_000)
    }
    await page.waitForTimeout(500)

    expect(listRequests(api)).toHaveLength(2)
  })
})
