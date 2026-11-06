import type { Project } from '@/types/project'
import type { Ref } from 'vue'
import { errorMessage } from '@/utils/errorsHandler'
import { useNotificationStore } from '@/stores/notification'
import { reactive, ref, watch } from 'vue'
import { createFavorite, deleteFavorite, deleteProject } from '@/api/projects'

type ProjectList = {
  error: Ref<unknown>
  replace: (project: Project) => void
  remove: (id: string) => void
}

export function useProjectActions(list: ProjectList) {
  const notificationStore = useNotificationStore()
  const favoritesInFlight = reactive(new Set<string>())
  const projectToRemove = ref<Project | null>(null)
  const removing = ref(false)

  function notifyError(error: unknown) {
    notificationStore.setCurrentMessage(errorMessage(error), 'danger')
  }

  watch(list.error, (caught) => {
    if (caught) notifyError(caught)
  })

  async function toggleFavorite(project: Project) {
    if (favoritesInFlight.has(project.id)) return

    favoritesInFlight.add(project.id)

    try {
      const request = project.favorite ? deleteFavorite : createFavorite
      list.replace(await request(project.id))
    } catch (error) {
      notifyError(error)
    } finally {
      favoritesInFlight.delete(project.id)
    }
  }

  function askRemove(project: Project) {
    projectToRemove.value = project
  }

  function cancelRemove() {
    if (!removing.value) projectToRemove.value = null
  }

  async function removeProject() {
    const project = projectToRemove.value
    if (!project || removing.value) return

    removing.value = true

    try {
      const response = await deleteProject(project.id)
      list.remove(project.id)
      notificationStore.setCurrentMessage(response.message, 'success')
    } catch (error) {
      notifyError(error)
    } finally {
      removing.value = false
      projectToRemove.value = null
    }
  }

  return {
    favoritesInFlight,
    projectToRemove,
    removing,
    toggleFavorite,
    askRemove,
    cancelRemove,
    removeProject,
  }
}
