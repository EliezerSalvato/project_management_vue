import { errorResponse, expect, test } from '../support/fixtures'
import {
  PROJECTS_PATH,
  buildProject,
  buildProjects,
  favoritePath,
  projectPath,
  projectResponse,
  projectsPage,
  ptBrUser,
} from '../support/projects'

test.use({ appLocale: 'pt-BR' })

test.describe('Projects list', () => {
  test('shows the empty state when the user has no projects', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/projects')

    await expect(page.getByRole('heading', { name: 'Nenhum projeto' })).toBeVisible()
    await expect(
      page.getByText('Clique no botão abaixo para criar o primeiro e gerenciá-lo.'),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Novo projeto' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(0)
    expect(api.requestsTo('GET', PROJECTS_PATH)[0]?.query.has('after')).toBe(false)
  })

  test('shows the generic error when the list fails', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { status: 500, body: errorResponse('Erro ao listar projetos') })

    await page.goto('/projects')

    await expect(page.locator('.notification-danger')).toContainText(
      'Algo deu errado. Por favor, tente novamente.',
    )
  })

  test('redirects a signed-out user from every projects route to sign-in', async ({ page }) => {
    for (const path of [
      '/projects',
      '/projects/search?q=abc',
      '/projects/new',
      '/projects/1/edit',
    ]) {
      await page.goto(path)

      await expect(page).toHaveURL(/\/users\/sign-in\?/)
      expect(new URL(page.url()).searchParams.get('redirect')).toBe(path)
    }
  })

  test('redirects the root path to the projects list', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/')

    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { name: 'Nenhum projeto' })).toBeVisible()
  })

  test('shows the logo, the search icon and the account actions in the header', async ({
    page,
    api,
  }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/projects')

    const header = page.getByRole('banner')
    const logo = header.getByRole('link', { name: 'Gerenciador de Projetos' })
    await expect(logo).toBeVisible()
    await expect(logo.locator('img')).toBeVisible()
    await expect(header.getByRole('button', { name: 'Buscar' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Editar perfil' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Sair' })).toBeVisible()
    await expect(header.locator('.locale-switcher').getByRole('button')).toBeVisible()
    await expect(header.getByRole('link')).toHaveCount(2)
    await expect(header.getByRole('button')).toHaveCount(3)
    await expect(header.getByRole('textbox')).toHaveCount(0)

    // Form pages: same header without the search icon (new-project.png, edit-project.png).
    const project = buildProject({ id: '7' })
    api.on('GET', projectPath(project.id), { body: projectResponse(project) })
    for (const path of ['/projects/new', `/projects/${project.id}/edit`]) {
      await page.goto(path)
      await expect(page.getByLabel('Nome do projeto')).toBeVisible()

      await expect(header).toHaveCount(1)
      await expect(logo).toBeVisible()
      await expect(header.getByRole('button', { name: 'Buscar' })).toHaveCount(0)
      await expect(header.getByRole('link')).toHaveCount(2)
      await expect(header.getByRole('button')).toHaveCount(2)
      await expect(header.getByRole('textbox')).toHaveCount(0)
      await expect(header.locator('input, select, textarea')).toHaveCount(0)
    }
  })

  test('logo navigates to the projects list', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/projects?sort=recent_start')

    await page.getByRole('banner').getByRole('link', { name: 'Gerenciador de Projetos' }).click()

    await expect(page).toHaveURL('/projects')
  })

  test('redirects to sign-in when the session expires during the list request', async ({
    page,
    api,
  }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, () => {
      // The access token expired and the refresh cookie is gone too.
      api.signOut()

      return { status: 401, body: errorResponse('Unauthorized') }
    })

    await page.goto('/projects')

    await expect(page).toHaveURL(/\/users\/sign-in/)
    expect(api.requestsTo('GET', PROJECTS_PATH).length).toBeGreaterThanOrEqual(1)
  })

  test('shows one card per project with name, client and dates', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage([
        buildProject({
          id: '1',
          name: 'Projeto 01',
          clientName: 'Clicksign',
          startDate: '2024-09-01',
          endDate: '2024-12-12',
        }),
        buildProject({
          id: '2',
          name: 'Projeto 02',
          clientName: 'Acme',
          startDate: '2025-01-15',
          endDate: '2025-03-31',
        }),
      ]),
    })

    await page.goto('/projects')

    await expect(page.getByRole('article')).toHaveCount(2)
    const first = page.getByRole('article', { name: 'Projeto 01', exact: true })
    await expect(first.getByRole('heading')).toHaveText('Projeto 01')
    await expect(first).toContainText(/Cliente:\s*Clicksign/)
    await expect(first).toContainText('01 de setembro de 2024')
    await expect(first).toContainText('12 de dezembro de 2024')
    const second = page.getByRole('article', { name: 'Projeto 02', exact: true })
    await expect(second).toContainText(/Cliente:\s*Acme/)
    await expect(second).toContainText('15 de janeiro de 2025')
    await expect(second).toContainText('31 de março de 2025')
  })

  test('shows the total count from the API next to the title', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage(buildProjects(20), { next: '20', count: 25, limit: 20 }),
    })

    await page.goto('/projects')

    await expect(page.getByRole('article')).toHaveCount(20)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projetos (25)')
  })

  test('shows the placeholder when a project has no cover', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage([
        buildProject({ id: '1', name: 'Sem capa', coverImageUrl: null }),
        buildProject({
          id: '2',
          name: 'Com capa',
          coverImageUrl: 'http://api.e2e.test/covers/2.png',
        }),
      ]),
    })

    await page.goto('/projects')

    const withoutCover = page.getByRole('article', { name: 'Sem capa' })
    await expect(withoutCover.getByTestId('cover-placeholder')).toBeVisible()
    await expect(withoutCover.locator('.project-card-cover')).toHaveCSS(
      'background-color',
      'rgb(105, 92, 205)',
    )
    const withCover = page.getByRole('article', { name: 'Com capa' })
    await expect(withCover.getByTestId('cover-placeholder')).toHaveCount(0)
    await expect(withCover.locator('.project-card-cover-image')).toHaveAttribute(
      'src',
      'http://api.e2e.test/covers/2.png',
    )
  })

  test('navigates to the new project page from the empty state and the header button', async ({
    page,
    api,
  }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/projects')
    await page.getByRole('link', { name: 'Novo projeto' }).click()

    await expect(page).toHaveURL('/projects/new')

    api.on('GET', PROJECTS_PATH, { body: projectsPage(buildProjects(2)) })
    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(2)
    await page.getByRole('link', { name: 'Novo projeto' }).click()

    await expect(page).toHaveURL('/projects/new')
  })

  test('wraps long names and clients, keeping dividers aligned across a row', async ({
    page,
    api,
  }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, {
      body: projectsPage([
        buildProject({
          id: '1',
          name: 'Projeto com um nome muito longo que não cabe na largura do cartão',
          clientName: 'Cliente com uma razão social muito longa que também não cabe',
        }),
        buildProject({ id: '2', name: 'Curto', clientName: 'Acme' }),
      ]),
    })
    await page.setViewportSize({ width: 1280, height: 900 })

    await page.goto('/projects')

    await expect(page.getByRole('article')).toHaveCount(2)
    const longCard = page.getByRole('article').first()
    for (const element of [longCard.getByRole('heading'), longCard.locator('.project-card-client')]) {
      await expect(element).toHaveCSS('white-space', 'normal')
      expect((await element.boundingBox())!.height).toBeGreaterThan(25)
      expect(await element.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(false)
    }

    // Cards on the same row grow to the tallest one and their dividers line up, while the client
    // stays right below the name (the extra space goes between the client and the divider).
    // Measured in a single frame so late layout shifts (e.g. font loading) don't skew it.
    await expect
      .poll(() =>
        page.getByRole('article').evaluateAll((cards) => {
          const [long, short] = cards.map((card) => {
            const rect = (selector: string) => card.querySelector(selector)!.getBoundingClientRect()
            return {
              top: card.getBoundingClientRect().top,
              height: card.getBoundingClientRect().height,
              divider: rect('.project-card-info').bottom,
              clientGap: rect('.project-card-client').top - rect('.project-card-name').bottom,
            }
          })
          return JSON.stringify(long) === JSON.stringify(short)
        }),
      )
      .toBe(true)
  })

  test('favorites toggle filters the list by favorite and back', async ({ page, api }) => {
    const favorite = buildProject({ id: '1', name: 'Favorito', favorite: true })
    const plain = buildProject({ id: '2', name: 'Comum', favorite: false })
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, ({ query }) => ({
      body: projectsPage(query.get('favorite') === 'true' ? [favorite] : [favorite, plain]),
    }))

    await page.goto('/projects')
    await expect(page.getByRole('article')).toHaveCount(2)
    const toggle = page.getByRole('switch', { name: 'Apenas Favoritos' })
    await expect(toggle).not.toBeChecked()

    await page.getByText('Apenas Favoritos').click()

    await expect(toggle).toBeChecked()
    await expect(page).toHaveURL('/projects?favorite=true')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Favorito'])
    expect(api.requestsTo('GET', PROJECTS_PATH).at(-1)?.query.get('favorite')).toBe('true')

    await page.getByText('Apenas Favoritos').click()

    await expect(toggle).not.toBeChecked()
    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Favorito', 'Comum'])
    expect(api.requestsTo('GET', PROJECTS_PATH).at(-1)?.query.has('favorite')).toBe(false)
  })

  test('favorites filter keeps the toolbar when no project is favorite', async ({ page, api }) => {
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([]) })

    await page.goto('/projects?favorite=true')

    await expect(page.getByText('Nenhum projeto favorito')).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Apenas Favoritos' })).toBeChecked()
    await expect(page.getByRole('heading', { name: 'Nenhum projeto' })).toHaveCount(0)
  })

  test('unfavoriting with the filter on removes the card', async ({ page, api }) => {
    const favorite = buildProject({ id: '1', name: 'Favorito', favorite: true })
    api.signIn(ptBrUser)
    api.on('GET', PROJECTS_PATH, { body: projectsPage([favorite]) })
    api.on('DELETE', favoritePath('1'), {
      body: projectResponse({ ...favorite, favorite: false }),
    })

    await page.goto('/projects?favorite=true')
    await expect(page.getByRole('article')).toHaveCount(1)

    await page.getByRole('article').getByRole('button', { name: 'Favorito' }).click()

    await expect(page.getByRole('article')).toHaveCount(0)
    await expect(page.getByText('Nenhum projeto favorito')).toBeVisible()
  })
})
