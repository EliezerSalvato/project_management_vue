import type { Page } from '@playwright/test'
import { createUser, expect, signIn, test } from './support/fixtures'
import {
  PNG_BYTES,
  apiToken,
  card,
  cardNames,
  expectImageLoaded,
  fillProjectForm,
  isoDate,
  listProjects,
  pickCover,
  seedProject,
} from './support/projects'

const coverOf = (page: Page, name: string) => card(page, name).locator('.project-card-cover-image')

const projectFor = (name: string, startOffset = 1, endOffset = 30) => ({
  name,
  client_name: 'Acme Corp',
  start_date: isoDate(startOffset),
  end_date: isoDate(endOffset),
})

test.describe('Projects (real API)', () => {
  test('creates a project with a cover and lists it', async ({ page, request }) => {
    const user = await createUser(request)

    await signIn(page, user)
    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('No projects')

    await page.goto('/projects/new')
    await fillProjectForm(page, {
      name: 'Website Redesign',
      clientName: 'Acme Corp',
      startDate: isoDate(1),
      endDate: isoDate(30),
    })
    await pickCover(page, PNG_BYTES)
    await page.getByRole('button', { name: 'Save project' }).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.locator('.notification-success')).toContainText(
      'Project created successfully',
    )
    await expect(card(page, 'Website Redesign')).toContainText('Acme Corp')
    await expectImageLoaded(page, coverOf(page, 'Website Redesign'))

    const [saved] = await listProjects(request, await apiToken(request, user))
    expect(saved).toMatchObject({
      name: 'Website Redesign',
      client_name: 'Acme Corp',
      start_date: isoDate(1),
      end_date: isoDate(30),
      favorite: false,
    })
    expect(saved?.cover_image_url).toBeTruthy()
  })

  test('edits a project, replaces and then removes its cover', async ({ page, request }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    const { id } = await seedProject(request, token, projectFor('Old Project'))

    await signIn(page, user, { redirect: `/projects/${id}/edit` })
    await expect(page.getByLabel('Project name')).toHaveValue('Old Project')
    await expect(page.getByLabel('Client')).toHaveValue('Acme Corp')

    await page.getByLabel('Project name').fill('New Project')
    await page.getByLabel('Client').fill('Globex')
    await pickCover(page, PNG_BYTES)
    await page.getByRole('button', { name: 'Save project' }).click()

    await expect(page).toHaveURL('/projects')
    await expect(page.locator('.notification-success')).toContainText(
      'Project updated successfully',
    )
    await expect(card(page, 'New Project')).toContainText('Globex')
    await expectImageLoaded(page, coverOf(page, 'New Project'))

    await card(page, 'New Project').getByRole('button', { name: 'Options' }).click()
    await card(page, 'New Project').getByRole('menuitem', { name: 'Edit' }).click()
    await expect(page).toHaveURL(`/projects/${id}/edit`)
    await expectImageLoaded(page, page.getByRole('img', { name: 'Selected project cover' }))

    await page.getByRole('button', { name: 'Remove cover' }).click()
    await page.getByRole('button', { name: 'Save project' }).click()

    await expect(page).toHaveURL('/projects')
    await expect(card(page, 'New Project').getByTestId('cover-placeholder')).toBeVisible()

    const [saved] = await listProjects(request, token)
    expect(saved).toMatchObject({
      name: 'New Project',
      client_name: 'Globex',
      cover_image_url: null,
    })
  })

  test('favorites persist and filter the list', async ({ page, request }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    await seedProject(request, token, projectFor('Alpha Project'))
    await seedProject(request, token, projectFor('Beta Project'))

    await signIn(page, user)
    await expect(page.getByRole('article')).toHaveCount(2)

    const star = card(page, 'Beta Project').getByRole('button', { name: 'Favorite' })
    await star.click()
    await expect(star).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await expect(star).toHaveAttribute('aria-pressed', 'true')
    await expect(
      card(page, 'Alpha Project').getByRole('button', { name: 'Favorite' }),
    ).toHaveAttribute('aria-pressed', 'false')

    await page.getByText('Favorites only').click()
    await expect(page).toHaveURL('/projects?favorite=true')
    await expect(cardNames(page)).toHaveText(['Beta Project'])

    await star.click()
    await expect(page.getByRole('article')).toHaveCount(0)
    await page.reload()
    await expect(page.getByText('No favorite projects')).toBeVisible()

    const saved = await listProjects(request, token)
    expect(saved.map(({ favorite }) => favorite)).toEqual([false, false])
  })

  test('sorts by every order the API supports', async ({ page, request }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    // recent_start lists started projects first, then upcoming ones by the soonest start.
    // The API rejects past start dates, so starting today is the only way to seed a started one.
    await seedProject(request, token, projectFor('Charlie Project', 1, 10))
    await seedProject(request, token, projectFor('alpha Project', 5, 30))
    await seedProject(request, token, projectFor('Bravo Project', 0, 20))

    await signIn(page, user)
    await expect(cardNames(page)).toHaveText(['alpha Project', 'Bravo Project', 'Charlie Project'])

    const orders = {
      'Most recently started': ['Bravo Project', 'Charlie Project', 'alpha Project'],
      'Nearest deadline': ['Charlie Project', 'Bravo Project', 'alpha Project'],
      'Alphabetical order': ['alpha Project', 'Bravo Project', 'Charlie Project'],
    }

    for (const [label, names] of Object.entries(orders)) {
      await page.getByRole('button', { name: 'Sort projects' }).click()
      await page.getByRole('option', { name: label }).click()
      await expect(cardNames(page)).toHaveText(names)
    }
  })

  test('loads the next page with the cursor on scroll', async ({ page, request }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    const names = Array.from({ length: 25 }, (_, i) => `Project ${String(i + 1).padStart(2, '0')}`)
    for (const name of names) await seedProject(request, token, projectFor(name))

    await signIn(page, user)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('25')
    await expect(page.getByRole('article')).toHaveCount(20)

    await page.getByRole('article').last().scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 10_000)

    await expect(page.getByRole('article')).toHaveCount(25)
    await expect(cardNames(page)).toHaveText(names)
  })

  test('keeps scrolling after removing the project used as the cursor', async ({
    page,
    request,
  }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    const names = Array.from({ length: 25 }, (_, i) => `Project ${String(i + 1).padStart(2, '0')}`)
    for (const name of names) await seedProject(request, token, projectFor(name))

    await signIn(page, user)
    await expect(page.getByRole('article')).toHaveCount(20)

    // Project 20 is the API's `next` cursor; the API rejects a deleted project as `after`.
    // dispatchEvent keeps the page at the top: scrolling to the card would load page 2 first.
    await card(page, 'Project 20').getByRole('button', { name: 'Options' }).dispatchEvent('click')
    await card(page, 'Project 20').getByRole('menuitem', { name: 'Remove' }).dispatchEvent('click')
    await expect(page.getByRole('article')).toHaveCount(20)
    await page
      .getByRole('dialog', { name: 'Remove project' })
      .getByRole('button', { name: 'Confirm' })
      .click()
    await expect(page.getByRole('article')).toHaveCount(19)

    await page.getByRole('article').last().scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 10_000)

    await expect(cardNames(page)).toHaveText(names.filter((name) => name !== 'Project 20'))
    await expect(page.locator('.notification-danger')).toHaveCount(0)
  })

  test("does not open another user's project", async ({ page, request }) => {
    const owner = await createUser(request)
    const { id } = await seedProject(
      request,
      await apiToken(request, owner),
      projectFor('Private Project'),
    )
    const intruder = await createUser(request)

    await signIn(page, intruder, { redirect: `/projects/${id}/edit` })

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByLabel('Project name')).toHaveCount(0)
  })

  test('removes a project after confirming', async ({ page, request }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    await seedProject(request, token, projectFor('Keep Project'))
    await seedProject(request, token, projectFor('Drop Project'))

    await signIn(page, user)
    await card(page, 'Drop Project').getByRole('button', { name: 'Options' }).click()
    await card(page, 'Drop Project').getByRole('menuitem', { name: 'Remove' }).click()
    await page
      .getByRole('dialog', { name: 'Remove project' })
      .getByRole('button', { name: 'Confirm' })
      .click()

    await expect(page.locator('.notification-success')).toContainText(
      'Project deleted successfully',
    )
    await expect(cardNames(page)).toHaveText(['Keep Project'])

    await page.reload()
    await expect(cardNames(page)).toHaveText(['Keep Project'])
    expect((await listProjects(request, token)).map(({ name }) => name)).toEqual(['Keep Project'])
  })

  test('searches by name and client, ignoring case and accents', async ({ page, request }) => {
    const user = await createUser(request)
    const token = await apiToken(request, user)
    await seedProject(request, token, projectFor('Gestão de Projetos'))
    await seedProject(request, token, {
      ...projectFor('Website Redesign'),
      client_name: 'GESTAO Corp',
    })
    await seedProject(request, token, projectFor('Mobile App'))

    await signIn(page, user)
    await expect(page.getByRole('article')).toHaveCount(3)

    await page.getByRole('banner').getByRole('button', { name: 'Search' }).click()
    await page.getByRole('textbox', { name: 'Search projects' }).fill('gestão')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/projects/search?q=gest%C3%A3o')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Search results')
    await expect(cardNames(page)).toHaveText(['Gestão de Projetos', 'Website Redesign'])

    await page.goto('/projects/search?q=nothing-matches')
    await expect(page.getByText('No projects found')).toBeVisible()
  })
})
