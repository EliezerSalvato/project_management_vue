import type { Page } from '@/types/api/pagination'
import { computed, ref, shallowRef } from 'vue'

export function useInfiniteList<T extends { id: string }>(
  fetchPage: (after: string | undefined) => Promise<Page<T>>,
) {
  const items = shallowRef<T[]>([])
  const count = ref<number | null>(null)
  // undefined before the first page; null once the API says nothing is left.
  const cursor = ref<string | null | undefined>(undefined)
  const loading = ref(false)
  const error = ref<unknown>(null)
  let generation = 0

  const hasMore = computed(() => cursor.value !== null)

  async function loadMore(): Promise<void> {
    if (loading.value || !hasMore.value) return

    const current = generation
    loading.value = true
    error.value = null

    try {
      const page = await fetchPage(cursor.value ?? undefined)
      if (current !== generation) return

      const loadedIds = new Set(items.value.map((item) => item.id))
      items.value = [...items.value, ...page.items.filter((item) => !loadedIds.has(item.id))]
      count.value = page.pagination.count
      cursor.value = page.pagination.next
    } catch (caught) {
      if (current === generation) error.value = caught
    } finally {
      if (current === generation) loading.value = false
    }
  }

  function reset(): void {
    generation++
    items.value = []
    count.value = null
    cursor.value = undefined
    loading.value = false
    error.value = null
  }

  function remove(id: string): void {
    const next = items.value.filter((item) => item.id !== id)
    if (next.length === items.value.length) return

    items.value = next
    if (count.value !== null) count.value = Math.max(0, count.value - 1)

    // The API rejects a deleted project as `after`, so fall back to the last one still loaded.
    if (cursor.value === id) cursor.value = next[next.length - 1]?.id
  }

  function replace(item: T): void {
    items.value = items.value.map((current) => (current.id === item.id ? item : current))
  }

  return { items, count, loading, hasMore, error, loadMore, reset, remove, replace }
}
