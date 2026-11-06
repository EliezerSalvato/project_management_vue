import { useUserStore } from '@/stores/user'
import { computed, ref, watch } from 'vue'
import {
  addRecentSearch,
  readRecentSearches,
  removeRecentSearch,
  writeRecentSearches,
} from '@/utils/recentSearches'

export const RECENT_SEARCHES_KEY_PREFIX = 'projects.recentSearches'

export function useRecentSearches() {
  const userStore = useUserStore()
  const key = computed(() => {
    const id = userStore.user?.id

    return id ? `${RECENT_SEARCHES_KEY_PREFIX}.${id}` : null
  })
  const searches = ref<string[]>([])

  watch(
    key,
    (value) => {
      searches.value = value ? readRecentSearches(localStorage, value) : []
    },
    { immediate: true },
  )

  function save(list: string[]) {
    searches.value = list
    if (key.value) writeRecentSearches(localStorage, key.value, list)
  }

  function add(term: string) {
    save(addRecentSearch(searches.value, term))
  }

  function remove(term: string) {
    save(removeRecentSearch(searches.value, term))
  }

  return { searches, add, remove }
}
