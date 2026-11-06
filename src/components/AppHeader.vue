<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import logoUrl from '@/assets/logo.png'
import searchIconUrl from '@/assets/icons/search-light.svg'
import SearchBar from '@/components/project/SearchBar.vue'

const { t } = useI18n()
const route = useRoute()

const searchable = computed(() => route.name === 'projects')

const searchTerm = computed(() => {
  if (route.name !== 'projectSearch') return undefined

  return typeof route.query.q === 'string' ? route.query.q : ''
})

const searchOpen = ref(false)

watch(
  () => route.name,
  () => {
    searchOpen.value = false
  },
)

function closeSearch() {
  searchOpen.value = false
}
</script>

<template>
  <div class="app-top">
    <SearchBar v-if="searchTerm !== undefined" :initial-term="searchTerm" />
    <SearchBar v-else-if="searchOpen" @close="closeSearch" />

    <header v-else class="app-header">
      <RouterLink class="app-header-logo" :to="{ name: 'projects' }">
        <img :src="logoUrl" alt="" width="72" height="70" />
        <span>{{ t('appName') }}</span>
      </RouterLink>

      <button
        v-if="searchable"
        type="button"
        class="app-header-search"
        :aria-label="t('header.search')"
        @click="searchOpen = true"
      >
        <img :src="searchIconUrl" alt="" width="22" height="22" />
      </button>
    </header>
  </div>
</template>
