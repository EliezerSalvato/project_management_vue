import type { ProjectResponseApi } from '@/types/project'
import { apiRequest } from '@/api/client'
import { projectFromResource } from '@/transformers/project'

async function requestFavorite(id: string, method: 'POST' | 'DELETE') {
  const response = await apiRequest<ProjectResponseApi>(`/api/v1/projects/${id}/favorite`, {
    method,
  })

  return projectFromResource(response.data.project.data)
}

export function createFavorite(id: string) {
  return requestFavorite(id, 'POST')
}

export function deleteFavorite(id: string) {
  return requestFavorite(id, 'DELETE')
}
