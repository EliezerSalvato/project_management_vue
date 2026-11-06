<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useClickOutside } from '@/composables/useClickOutside'
import { useRecentSearches } from '@/composables/useRecentSearches'
import { MIN_SEARCH_TERM_LENGTH } from '@/utils/search'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import closeIconUrl from '@/assets/icons/close.svg'
import historyIconUrl from '@/assets/icons/history.svg'
import searchIconUrl from '@/assets/icons/search.svg'

const props = defineProps<{
  initialTerm?: string
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const router = useRouter()
const { searches, add, remove } = useRecentSearches()

const root = useTemplateRef<HTMLElement>('root')
const input = useTemplateRef<HTMLInputElement>('input')
const term = ref(props.initialTerm ?? '')
const listOpen = ref(props.initialTerm === undefined)
const enabled = ref(true)

const showRecent = computed(() => listOpen.value && searches.value.length > 0)
const showMinLengthHint = computed(() => {
  const length = term.value.trim().length
  return length > 0 && length < MIN_SEARCH_TERM_LENGTH
})

watch(
  () => props.initialTerm,
  (value) => {
    term.value = value ?? ''
  },
)

function close() {
  listOpen.value = false
  emit('close')
}

useClickOutside(root, close, enabled)

function run(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < MIN_SEARCH_TERM_LENGTH) return

  term.value = trimmed
  add(trimmed)
  listOpen.value = false
  input.value?.blur()
  void router.push({ name: 'projectSearch', query: { q: trimmed } })
}

function removeRecent(value: string) {
  remove(value)
  input.value?.focus()
}

onMounted(() => {
  if (props.initialTerm === undefined) input.value?.focus()
})
</script>

<template>
  <div ref="root" class="search-bar" :class="{ 'search-bar-open': showRecent }">
    <form class="search-bar-field" role="search" @submit.prevent="run(term)">
      <img :src="searchIconUrl" alt="" width="20" height="20" />
      <label class="search-bar-control">
        <input
          ref="input"
          v-model="term"
          type="text"
          class="search-bar-input"
          enterkeyhint="search"
          autocomplete="off"
          :placeholder="t('project.search.placeholder')"
          :aria-label="t('project.search.label')"
          :aria-describedby="showMinLengthHint ? 'search-bar-hint' : undefined"
          @focus="listOpen = true"
        />
        <span v-if="showMinLengthHint" id="search-bar-hint" class="search-bar-hint">
          {{ t('project.search.minLength', { count: MIN_SEARCH_TERM_LENGTH }) }}
        </span>
      </label>
    </form>

    <ul v-if="showRecent" class="search-bar-recent" :aria-label="t('project.search.recent')">
      <li v-for="search in searches" :key="search" class="search-bar-recent-item">
        <button type="button" class="search-bar-recent-run" @click="run(search)">
          <img :src="historyIconUrl" alt="" width="20" height="20" data-testid="history-icon" />
          <span>{{ search }}</span>
        </button>
        <button
          type="button"
          class="search-bar-recent-remove"
          :aria-label="t('project.search.removeRecent', { term: search })"
          @click="removeRecent(search)"
        >
          <img :src="closeIconUrl" alt="" width="20" height="20" />
        </button>
      </li>
    </ul>
  </div>
</template>
