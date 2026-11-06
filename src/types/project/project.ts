import type { JsonApiCreateResponse, JsonApiObjectResponse, JsonApiResource } from '@/types/api'

export type Project = {
  id: string
  name: string
  clientName: string
  /** `YYYY-MM-DD` */
  startDate: string
  /** `YYYY-MM-DD` */
  endDate: string
  favorite: boolean
  coverImageUrl: string | null
}

export type ProjectAttributesApi = {
  id: string
  name: string
  client_name: string
  start_date: string
  end_date: string
  favorite: boolean
  cover_image_url: string | null
}

export type ProjectResourceApi = JsonApiResource<'project', ProjectAttributesApi>

export type ProjectDataApi = { project: { data: ProjectResourceApi } }

export type ProjectResponseApi = JsonApiObjectResponse<ProjectDataApi>

export type ProjectSaveResponseApi = JsonApiCreateResponse<ProjectDataApi>
