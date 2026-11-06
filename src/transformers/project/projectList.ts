import type { Page } from '@/types/api'
import type { Project, ProjectListDataApi } from '@/types/project'
import { projectFromResource } from '@/transformers/project/project'

export function projectListFromApi(data: ProjectListDataApi): Page<Project> {
  return {
    items: data.projects.data.map(projectFromResource),
    pagination: data.pagination,
  }
}
