import type { MessageSuccessResponseApi } from '@/types/api'
import type {
  ProjectListQuery,
  ProjectListResponseApi,
  ProjectPayload,
  ProjectResponseApi,
  ProjectSaveResponseApi,
} from '@/types/project'
import { apiRequest } from '@/api/client'
import { projectFormTransformer, projectFromResource, projectListFromApi } from '@/transformers/project'

function listQueryString({ after, sort, search, favorite }: ProjectListQuery) {
  const params = new URLSearchParams()

  if (after) params.set('after', after)

  if (sort) params.set('sort', sort)

  if (search) params.set('search', search)

  if (favorite) params.set('favorite', 'true')

  const query = params.toString()

  return query ? `?${query}` : ''
}

function saveResult(response: ProjectSaveResponseApi) {
  return {
    project: projectFromResource(response.data.project.data),
    message: response.message,
  }
}

export async function listProjects(query: ProjectListQuery) {
  const response = await apiRequest<ProjectListResponseApi>(
    `/api/v1/projects${listQueryString(query)}`,
  )

  return projectListFromApi(response.data)
}

export async function getProject(id: string) {
  const response = await apiRequest<ProjectResponseApi>(`/api/v1/projects/${id}`)

  return projectFromResource(response.data.project.data)
}

export async function createProject(payload: ProjectPayload) {
  const response = await apiRequest<ProjectSaveResponseApi>('/api/v1/projects', {
    method: 'POST',
    body: projectFormTransformer.toFormData(payload),
  })

  return saveResult(response)
}

export async function updateProject(id: string, payload: ProjectPayload) {
  const response = await apiRequest<ProjectSaveResponseApi>(`/api/v1/projects/${id}`, {
    method: 'PATCH',
    body: projectFormTransformer.toFormData(payload),
  })

  return saveResult(response)
}

export function deleteProject(id: string) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/projects/${id}`, { method: 'DELETE' })
}
