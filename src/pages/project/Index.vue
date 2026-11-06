<script setup lang="ts">
import type { Project, ProjectSort } from '@/types/project'
import { listProjects } from '@/api/projects'
import { useI18n } from 'vue-i18n'
import { useInfiniteList } from '@/composables/useInfiniteList'
import { useProjectActions } from '@/composables/useProjectActions'
import { computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Loading from '@/components/Loading.vue'
import SelectInput from '@/components/inputs/SelectInput.vue'
import ToggleSwitch from '@/components/inputs/ToggleSwitch.vue'
import ProjectGrid from '@/components/project/ProjectGrid.vue'
import ProjectRemoveModal from '@/components/project/ProjectRemoveModal.vue'
import plusIconUrl from '@/assets/icons/plus-circle.png'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const SORTS: ProjectSort[] = ['name', 'recent_start', 'nearest_deadline']

const sortOptions = computed(() => [
  { value: 'name' as const, label: t('project.sort.name') },
  { value: 'recent_start' as const, label: t('project.sort.recentStart') },
  { value: 'nearest_deadline' as const, label: t('project.sort.nearestDeadline') },
])

const sort = computed<ProjectSort>(() => {
  const value = route.query.sort as ProjectSort

  return SORTS.includes(value) ? value : 'name'
})

const favoritesOnly = computed(() => route.query.favorite === 'true')

const list = useInfiniteList((after) =>
  listProjects({ after, sort: sort.value, favorite: favoritesOnly.value }),
)
const { items, count, loading, hasMore, error } = list

const firstLoad = computed(() => loading.value && items.value.length === 0)
const isEmpty = computed(() => count.value === 0 && !favoritesOnly.value)
const noFavorites = computed(() => count.value === 0 && favoritesOnly.value)

// With the favorites filter on, an unfavorited project no longer belongs in the list.
function onProjectUpdated(project: Project) {
  if (favoritesOnly.value && !project.favorite) {
    list.remove(project.id)
  } else {
    list.replace(project)
  }
}

const {
  favoritesInFlight,
  projectToRemove,
  removing,
  toggleFavorite,
  askRemove,
  cancelRemove,
  removeProject,
} = useProjectActions({
  replace: onProjectUpdated,
  remove: list.remove,
  error,
})

function onSortChange(value: ProjectSort) {
  void router.replace({ query: { ...route.query, sort: value } })
}

function onFavoritesOnlyChange(value: boolean) {
  void router.replace({ query: { ...route.query, favorite: value ? 'true' : undefined } })
}

watch([sort, favoritesOnly], () => {
  if (route.name !== 'projects') return

  list.reset()
  void list.loadMore()
})

void list.loadMore()
</script>

<template>
  <div class="project-page">
    <div class="project-page-content">
      <Loading v-if="firstLoad" />

      <section v-else-if="isEmpty" class="project-empty">
        <h1 class="project-empty-title">{{ t('project.list.emptyTitle') }}</h1>
        <p class="project-empty-description">{{ t('project.list.emptyDescription') }}</p>
        <RouterLink class="btn-pill btn-pill-lg" :to="{ name: 'newProject' }">
          <img :src="plusIconUrl" alt="" width="24" height="24" />
          {{ t('project.list.newProject') }}
        </RouterLink>
      </section>

      <template v-else-if="items.length || noFavorites">
        <div class="project-toolbar">
          <h1 class="project-toolbar-title">
            {{ t('project.list.title') }}
            <span class="project-toolbar-count">({{ count }})</span>
          </h1>

          <div class="project-toolbar-actions">
            <ToggleSwitch
              class="project-toolbar-favorites"
              :model-value="favoritesOnly"
              :label="t('project.list.favoritesOnly')"
              @update:model-value="onFavoritesOnlyChange"
            />

            <SelectInput
              class="project-toolbar-sort"
              :model-value="sort"
              :options="sortOptions"
              :label="t('project.list.sortLabel')"
              @update:model-value="onSortChange"
            />

            <RouterLink class="btn-pill project-toolbar-new" :to="{ name: 'newProject' }">
              <img :src="plusIconUrl" alt="" width="22" height="22" />
              {{ t('project.list.newProject') }}
            </RouterLink>
          </div>
        </div>

        <p v-if="noFavorites" class="project-list-empty">{{ t('project.list.noFavorites') }}</p>

        <ProjectGrid
          v-else
          :projects="items"
          :loading="loading"
          :has-more="hasMore && !error"
          :pending-favorites="favoritesInFlight"
          @load-more="list.loadMore"
          @toggle-favorite="toggleFavorite"
          @remove="askRemove"
        />
      </template>
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
