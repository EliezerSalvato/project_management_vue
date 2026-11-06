import type { ProjectAttributesApi, ProjectListDataApi, ProjectResourceApi } from '@/types/project'
import { describe, expect, it } from 'vitest'
import {
  projectFormTransformer,
  projectFromResource,
  projectListFromApi,
} from '@/transformers/project'

function buildProjectResource(attributes: Partial<ProjectAttributesApi> = {}): ProjectResourceApi {
  return {
    id: '0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f',
    type: 'project',
    attributes: {
      id: '0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f',
      name: 'Website Redesign',
      client_name: 'Acme Corp',
      start_date: '2024-09-01',
      end_date: '2024-12-20',
      favorite: true,
      cover_image_url: 'http://api.test/cover.png',
      ...attributes,
    },
  }
}

describe('projectFromResource', () => {
  it('maps a JSON:API project resource to the domain project', () => {
    expect(projectFromResource(buildProjectResource())).toEqual({
      id: '0192f3a0-7c1e-7d2a-9b4e-1a2b3c4d5e6f',
      name: 'Website Redesign',
      clientName: 'Acme Corp',
      startDate: '2024-09-01',
      endDate: '2024-12-20',
      favorite: true,
      coverImageUrl: 'http://api.test/cover.png',
    })
  })

  it('keeps a missing cover as null', () => {
    expect(
      projectFromResource(buildProjectResource({ cover_image_url: null })).coverImageUrl,
    ).toBeNull()
  })
})

describe('projectListFromApi', () => {
  it('maps the projects list and pagination to a page', () => {
    const data: ProjectListDataApi = {
      projects: { data: [buildProjectResource(), buildProjectResource({ name: 'App' })] },
      pagination: { next: '2', count: 25, limit: 10 },
    }

    const page = projectListFromApi(data)

    expect(page.items.map((project) => project.name)).toEqual(['Website Redesign', 'App'])
    expect(page.items[0]).toEqual(projectFromResource(buildProjectResource()))
    expect(page.pagination).toEqual({ next: '2', count: 25, limit: 10 })
  })

  it('maps an empty list', () => {
    expect(
      projectListFromApi({
        projects: { data: [] },
        pagination: { next: null, count: 0, limit: 10 },
      }),
    ).toEqual({ items: [], pagination: { next: null, count: 0, limit: 10 } })
  })
})

describe('projectFormTransformer', () => {
  const form = {
    name: 'Website Redesign',
    clientName: 'Acme Corp',
    startDate: '2024-09-01',
    endDate: '2024-12-20',
    coverImage: null,
  }

  it('serializes the fields to FormData with snake_case keys', () => {
    const data = projectFormTransformer.toFormData(form)

    expect(Object.fromEntries(data.entries())).toEqual({
      name: 'Website Redesign',
      client_name: 'Acme Corp',
      start_date: '2024-09-01',
      end_date: '2024-12-20',
    })
  })

  it('adds cover_image when a file was picked', () => {
    const file = new File(['png'], 'cover.png', { type: 'image/png' })

    const data = projectFormTransformer.toFormData({ ...form, coverImage: file })
    const cover = data.get('cover_image')

    expect(cover).toBeInstanceOf(File)
    expect((cover as File).name).toBe('cover.png')
  })

  it('leaves cover_image out when no file was picked', () => {
    expect(projectFormTransformer.toFormData(form).has('cover_image')).toBe(false)
  })

  it('sends remove_cover_image when the saved cover was removed', () => {
    const data = projectFormTransformer.toFormData({ ...form, removeCoverImage: true })

    expect(data.get('remove_cover_image')).toBe('true')
    expect(data.has('cover_image')).toBe(false)
  })

  it('sends only the new cover when a file replaces a removed one', () => {
    const file = new File(['png'], 'cover.png', { type: 'image/png' })

    const data = projectFormTransformer.toFormData({
      ...form,
      coverImage: file,
      removeCoverImage: true,
    })

    expect(data.get('cover_image')).toBeInstanceOf(File)
    expect(data.has('remove_cover_image')).toBe(false)
  })

  it('builds the form from a project without a cover file', () => {
    expect(projectFormTransformer.fromProject(projectFromResource(buildProjectResource()))).toEqual(
      form,
    )
  })
})
