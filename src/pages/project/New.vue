<script setup lang="ts">
import type { ProjectPayload } from '@/types/project'
import { createProject } from '@/api/projects'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { ref, useTemplateRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ProjectForm from '@/components/project/ProjectForm.vue'
import arrowLeftIconUrl from '@/assets/icons/arrow-left.svg'

const { t } = useI18n()
const router = useRouter()
const notificationStore = useNotificationStore()

const form = useTemplateRef<InstanceType<typeof ProjectForm>>('form')
const saving = ref(false)

async function onSubmit(payload: ProjectPayload) {
  if (saving.value) return

  saving.value = true

  try {
    const { message } = await createProject(payload)
    await router.push({ name: 'projects' })
    notificationStore.setCurrentMessage(message, 'success')
  } catch (error) {
    form.value?.applyCatch(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="project-page">
    <div class="project-page-content">
      <RouterLink class="page-back" :to="{ name: 'projects' }">
        <img :src="arrowLeftIconUrl" alt="" width="16" height="16" />
        {{ t('buttons.back') }}
      </RouterLink>
      <h1 class="project-page-title">{{ t('project.form.newTitle') }}</h1>

      <div class="project-form-panel">
        <ProjectForm ref="form" :loading="saving" @submit="onSubmit" />
      </div>
    </div>
  </div>
</template>
