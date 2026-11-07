<script setup lang="ts">
import type { Project } from '@/types/project'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InfiniteScrollSentinel from '@/components/InfiniteScrollSentinel.vue'
import Loading from '@/components/Loading.vue'
import ProjectCard from '@/components/project/ProjectCard.vue'

defineProps<{
  projects: Project[]
  loading: boolean
  hasMore: boolean
  /** The last page failed: stop the infinite scroll and offer a retry instead. */
  failed?: boolean
  highlight?: string
  pendingFavorites?: ReadonlySet<string>
}>()

const emit = defineEmits<{
  loadMore: []
  toggleFavorite: [project: Project]
  remove: [project: Project]
}>()

const { t } = useI18n()

const openMenuId = ref<string | null>(null)

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu(id: string) {
  if (openMenuId.value === id) openMenuId.value = null
}
</script>

<template>
  <div class="project-grid">
    <ProjectCard
      v-for="project in projects"
      :key="project.id"
      :project="project"
      :menu-open="openMenuId === project.id"
      :highlight="highlight"
      :favorite-pending="pendingFavorites?.has(project.id) ?? false"
      @toggle-favorite="emit('toggleFavorite', $event)"
      @toggle-menu="toggleMenu(project.id)"
      @close-menu="closeMenu(project.id)"
      @remove="emit('remove', $event)"
    />
  </div>

  <InfiniteScrollSentinel v-if="hasMore && !loading && !failed" @visible="emit('loadMore')" />
  <Loading v-if="loading" />
  <div v-else-if="failed" class="project-load-error">
    <p>{{ t('project.list.loadError') }}</p>
    <button type="button" class="btn-pill btn-pill-outline" @click="emit('loadMore')">
      {{ t('buttons.retry') }}
    </button>
  </div>
</template>
