import type { JsonApiObjectResponse, PaginationApi } from '@/types/api'
import type { ProjectResourceApi } from '@/types/project/project'

export type ProjectSort = 'name' | 'recent_start' | 'nearest_deadline'

export type ProjectListQuery = {
  after?: string
  sort?: ProjectSort
  search?: string
  favorite?: boolean
}

export type ProjectListDataApi = {
  projects: { data: ProjectResourceApi[] }
  pagination: PaginationApi
}

export type ProjectListResponseApi = JsonApiObjectResponse<ProjectListDataApi>
