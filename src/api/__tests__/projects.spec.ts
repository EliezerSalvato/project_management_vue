import type { ProjectResourceApi } from '@/types/project'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '@/api/client'
import {
  createFavorite,
  createProject,
  deleteFavorite,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '@/api/projects'

vi.mock('@/api/client', () => ({ apiRequest: vi.fn() }))

const request = vi.mocked(apiRequest)

const resource: ProjectResourceApi = {
  id: '0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f',
  type: 'project',
  attributes: {
    id: '0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f',
    name: 'Website Redesign',
    client_name: 'Acme Corp',
    start_date: '2024-09-01',
    end_date: '2024-12-20',
    favorite: false,
    cover_image_url: null,
  },
}

const project = {
  id: '0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f',
  name: 'Website Redesign',
  clientName: 'Acme Corp',
  startDate: '2024-09-01',
  endDate: '2024-12-20',
  favorite: false,
  coverImageUrl: null,
}

const form = {
  name: 'Website Redesign',
  clientName: 'Acme Corp',
  startDate: '2024-09-01',
  endDate: '2024-12-20',
  coverImage: null,
}

function projectResponse(message?: string) {
  return { status: 'success', type: 'object', message, data: { project: { data: resource } } }
}

function lastCall() {
  const [path, options] = request.mock.lastCall!

  return { path, options: options ?? {} }
}

beforeEach(() => {
  request.mockReset()
})

describe('listProjects', () => {
  beforeEach(() => {
    request.mockResolvedValue({
      status: 'success',
      type: 'object',
      data: {
        projects: { data: [resource] },
        pagination: { next: '42', count: 25, limit: 10 },
      },
    })
  })

  it('sends no query params for the first page without sort and search', async () => {
    await listProjects({})

    expect(lastCall().path).toBe('/api/v1/projects')
    expect(lastCall().options.method ?? 'GET').toBe('GET')
  })

  it('sends after, sort and search as query params', async () => {
    await listProjects({ after: '42', sort: 'nearest_deadline', search: 'acme corp' })

    const url = new URL(lastCall().path, 'http://api.test')
    expect(url.pathname).toBe('/api/v1/projects')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      after: '42',
      sort: 'nearest_deadline',
      search: 'acme corp',
    })
  })

  it('sends favorite=true only when filtering by favorites', async () => {
    await listProjects({ favorite: true })
    expect(lastCall().path).toBe('/api/v1/projects?favorite=true')

    await listProjects({ favorite: false })
    expect(lastCall().path).toBe('/api/v1/projects')
  })

  it('omits an empty search', async () => {
    await listProjects({ search: '' })

    expect(lastCall().path).toBe('/api/v1/projects')
  })

  it('returns the transformed page', async () => {
    await expect(listProjects({ after: '42' })).resolves.toEqual({
      items: [project],
      pagination: { next: '42', count: 25, limit: 10 },
    })
  })
})

describe('getProject', () => {
  it('gets the project by id and transforms it', async () => {
    request.mockResolvedValue(projectResponse())

    await expect(getProject('0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')).resolves.toEqual(project)
    expect(lastCall().path).toBe('/api/v1/projects/0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')
    expect(lastCall().options.method ?? 'GET').toBe('GET')
  })
})

describe('createProject', () => {
  it('posts the form as FormData and returns the project and message', async () => {
    request.mockResolvedValue(projectResponse('Project created.'))

    const result = await createProject(form)

    expect(lastCall().path).toBe('/api/v1/projects')
    expect(lastCall().options.method).toBe('POST')
    expect(lastCall().options.body).toBeInstanceOf(FormData)
    expect((lastCall().options.body as FormData).get('client_name')).toBe('Acme Corp')
    expect(result).toEqual({ project, message: 'Project created.' })
  })
})

describe('updateProject', () => {
  it('patches the project as FormData and returns the project and message', async () => {
    request.mockResolvedValue(projectResponse('Project updated.'))

    const result = await updateProject('0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f', form)

    expect(lastCall().path).toBe('/api/v1/projects/0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')
    expect(lastCall().options.method).toBe('PATCH')
    expect(lastCall().options.body).toBeInstanceOf(FormData)
    expect((lastCall().options.body as FormData).has('cover_image')).toBe(false)
    expect(result).toEqual({ project, message: 'Project updated.' })
  })
})

describe('deleteProject', () => {
  it('deletes the project and returns the API message', async () => {
    request.mockResolvedValue({ status: 'success', message: 'Project removed.' })

    await expect(deleteProject('0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')).resolves.toEqual({
      status: 'success',
      message: 'Project removed.',
    })
    expect(lastCall().path).toBe('/api/v1/projects/0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')
    expect(lastCall().options.method).toBe('DELETE')
  })
})

describe('createFavorite', () => {
  it('posts the favorite and returns the transformed project', async () => {
    request.mockResolvedValue(projectResponse())

    await expect(createFavorite('0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')).resolves.toEqual(project)
    expect(lastCall().path).toBe('/api/v1/projects/0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f/favorite')
    expect(lastCall().options.method).toBe('POST')
  })
})

describe('deleteFavorite', () => {
  it('deletes the favorite and returns the transformed project', async () => {
    request.mockResolvedValue(projectResponse())

    await expect(deleteFavorite('0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f')).resolves.toEqual(project)
    expect(lastCall().path).toBe('/api/v1/projects/0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f/favorite')
    expect(lastCall().options.method).toBe('DELETE')
  })
})
