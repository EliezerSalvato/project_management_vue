<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import LocaleSwitcher from '@/components/LocaleSwitcher.vue'
import logoUrl from '@/assets/logo.png'
import logoutIconUrl from '@/assets/icons/logout.svg'
import SearchBar from '@/components/project/SearchBar.vue'
import searchIconUrl from '@/assets/icons/search-light.svg'
import userIconUrl from '@/assets/icons/user.svg'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loggingOut = ref(false)

async function logout() {
  loggingOut.value = true

  try {
    await authStore.logout()
  } catch {
    // logout() already clears the local state when revoking fails
  } finally {
    loggingOut.value = false
  }

  await router.push({ name: 'signIn' })
}

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

      <nav class="app-header-actions">
        <LocaleSwitcher />

        <template v-if="authStore.isAuthenticated">
          <RouterLink
            class="navbar-item"
            :to="{ name: 'profile' }"
            :aria-label="t('header.profile')"
            :title="t('header.profile')"
          >
            <img :src="userIconUrl" alt="" width="22" height="22" />
          </RouterLink>

          <button
            type="button"
            class="navbar-item"
            :aria-label="t('header.logout')"
            :title="t('header.logout')"
            :disabled="loggingOut"
            @click="logout"
          >
            <img :src="logoutIconUrl" alt="" width="22" height="22" />
          </button>
        </template>
      </nav>
    </header>
  </div>
</template>
