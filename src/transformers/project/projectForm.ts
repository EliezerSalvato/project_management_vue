import type { Project, ProjectForm, ProjectPayload } from '@/types/project'

export const projectFormTransformer = {
  toFormData(payload: ProjectPayload): FormData {
    const data = new FormData()
    data.append('name', payload.name)
    data.append('client_name', payload.clientName)
    data.append('start_date', payload.startDate)
    data.append('end_date', payload.endDate)

    if (payload.coverImage) {
      data.append('cover_image', payload.coverImage)
    } else if (payload.removeCoverImage) {
      data.append('remove_cover_image', 'true')
    }

    return data
  },

  fromProject(project: Project): ProjectForm {
    return {
      name: project.name,
      clientName: project.clientName,
      startDate: project.startDate,
      endDate: project.endDate,
      coverImage: null,
    }
  },
}
