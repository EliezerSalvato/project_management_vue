<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useProfileLocaleSync } from '@/composables/useProfileLocaleSync'
import { watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import NotificationMessage from '@/components/NotificationMessage.vue'

const { t } = useI18n()
const route = useRoute()

useProfileLocaleSync()

watchEffect(() => {
  document.title = t('appName')
})
</script>

<template>
  <AppHeader v-if="route.meta.appHeader" />

  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <transition mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </main>

  <NotificationMessage />
</template>
