import type { Project } from '@/types/project/project'

export type ProjectForm = {
  name: string
  clientName: string
  startDate: string
  endDate: string
  coverImage: File | null
}

export type ProjectPayload = ProjectForm & {
  removeCoverImage?: boolean
}

export type ProjectSaveResult = {
  project: Project
  message: string
}
