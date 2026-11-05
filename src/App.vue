<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProfileLocaleSync } from '@/composables/useProfileLocaleSync'
import { watchEffect } from 'vue'

const { t } = useI18n()

useProfileLocaleSync()

watchEffect(() => {
  document.title = t('appName')
})
</script>

<template>
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <transition mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </main>
</template>
