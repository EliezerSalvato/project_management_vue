import type { Project, ProjectResourceApi } from '@/types/project'
import { keysToCamelCase } from '@/utils/case'

type ProjectAttributes = Omit<Project, 'id'>

export function projectFromResource(resource: ProjectResourceApi): Project {
  const { id: _numericId, ...attributes } = resource.attributes
  const project = keysToCamelCase<ProjectAttributes>(attributes)

  return { ...project, id: resource.id }
}
