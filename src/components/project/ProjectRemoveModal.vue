<script setup lang="ts">
import type { Project } from '@/types/project'
import { useI18n } from 'vue-i18n'
import ModalConfirm from '@/components/ModalConfirm.vue'

defineProps<{
  project: Project
  loading: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<template>
  <ModalConfirm
    :title="t('project.remove.title')"
    :message="t('project.remove.message')"
    :subject="project.name"
    :loading="loading"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>
