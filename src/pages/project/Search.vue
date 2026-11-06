<script setup lang="ts">
import { listProjects } from '@/api/projects'
import { useI18n } from 'vue-i18n'
import { useInfiniteList } from '@/composables/useInfiniteList'
import { useProjectActions } from '@/composables/useProjectActions'
import { MIN_SEARCH_TERM_LENGTH } from '@/utils/search'
import { computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Loading from '@/components/Loading.vue'
import ProjectGrid from '@/components/project/ProjectGrid.vue'
import ProjectRemoveModal from '@/components/project/ProjectRemoveModal.vue'
import arrowLeftIconUrl from '@/assets/icons/arrow-left.svg'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const term = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const isSearchable = computed(() => term.value.length >= MIN_SEARCH_TERM_LENGTH)

const list = useInfiniteList((after) => listProjects({ after, search: term.value }))
const { items, count, loading, hasMore, error } = list

const firstLoad = computed(() => loading.value && items.value.length === 0)

const {
  favoritesInFlight,
  projectToRemove,
  removing,
  toggleFavorite,
  askRemove,
  cancelRemove,
  removeProject,
} = useProjectActions(list)

watch(term, () => {
  if (route.name !== 'projectSearch') return

  list.reset()
  search()
})

function search() {
  if (!isSearchable.value) {
    void router.replace({ name: 'projects' })
    return
  }

  void list.loadMore()
}

search()
</script>

<template>
  <div class="project-page">
    <div class="project-page-content">
      <RouterLink class="page-back" :to="{ name: 'projects' }">
        <img :src="arrowLeftIconUrl" alt="" width="16" height="16" />
        {{ t('buttons.back') }}
      </RouterLink>
      <h1 class="project-page-title">{{ t('project.search.resultTitle') }}</h1>

      <Loading v-if="firstLoad" />

      <p v-else-if="count === 0" class="project-search-empty">
        {{ t('project.search.noResults') }}
      </p>

      <ProjectGrid
        v-else-if="isSearchable"
        :projects="items"
        :loading="loading"
        :has-more="hasMore && !error"
        :pending-favorites="favoritesInFlight"
        :highlight="term"
        @load-more="list.loadMore"
        @toggle-favorite="toggleFavorite"
        @remove="askRemove"
      />
    </div>

    <ProjectRemoveModal
      v-if="projectToRemove"
      :project="projectToRemove"
      :loading="removing"
      @confirm="removeProject"
      @cancel="cancelRemove"
    />
  </div>
</template>
