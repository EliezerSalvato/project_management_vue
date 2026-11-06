<script setup lang="ts">
import type { Project, ProjectPayload } from '@/types/project'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/utils/errorsHandler'
import { projectFormTransformer } from '@/transformers/project'
import { getProject, updateProject } from '@/api/projects'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Loading from '@/components/Loading.vue'
import NotFound from '@/pages/NotFound.vue'
import ProjectForm from '@/components/project/ProjectForm.vue'
import arrowLeftIconUrl from '@/assets/icons/arrow-left.svg'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const id = computed(() => String(route.params.id))
const project = ref<Project | null>(null)
const notFound = ref(false)
const loadFailed = ref(false)
const loading = ref(true)
const saving = ref(false)
const form = useTemplateRef<InstanceType<typeof ProjectForm>>('form')

const initialForm = computed(() =>
  project.value ? projectFormTransformer.fromProject(project.value) : undefined,
)

async function load() {
  const current = id.value

  project.value = null
  notFound.value = false
  loadFailed.value = false
  loading.value = true

  try {
    const loaded = await getProject(current)
    if (current === id.value) project.value = loaded
  } catch (error) {
    if (current !== id.value) return

    if (error instanceof ApiError && error.status === 404) {
      notFound.value = true
      return
    }

    loadFailed.value = true
    notificationStore.setCurrentMessage(errorMessage(error), 'danger')
  } finally {
    if (current === id.value) loading.value = false
  }
}

async function onSubmit(payload: ProjectPayload) {
  if (saving.value) return

  saving.value = true

  try {
    const { message } = await updateProject(id.value, payload)
    await router.push({ name: 'projects' })
    notificationStore.setCurrentMessage(message, 'success')
  } catch (error) {
    form.value?.applyCatch(error)
  } finally {
    saving.value = false
  }
}

watch(
  id,
  () => {
    if (route.name === 'editProject') void load()
  },
  { immediate: true },
)
</script>

<template>
  <NotFound v-if="notFound" />

  <div v-else class="project-page">
    <div class="project-page-content">
      <RouterLink class="page-back" :to="{ name: 'projects' }">
        <img :src="arrowLeftIconUrl" alt="" width="16" height="16" />
        {{ t('buttons.back') }}
      </RouterLink>
      <h1 class="project-page-title">{{ t('project.form.editTitle') }}</h1>

      <Loading v-if="loading" />

      <div v-else-if="loadFailed" class="project-load-error">
        <p>{{ t('project.form.loadError') }}</p>
        <button type="button" class="btn-pill btn-pill-outline" @click="load">
          {{ t('buttons.retry') }}
        </button>
      </div>

      <div v-else-if="project" class="project-form-panel">
        <ProjectForm
          ref="form"
          :initial="initialForm"
          :original="{ startDate: project.startDate, endDate: project.endDate }"
          :saved-cover-url="project.coverImageUrl"
          :loading="saving"
          @submit="onSubmit"
        />
      </div>
    </div>
  </div>
</template>
