<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="not-found">
    <div>
      <p class="not-found-code" aria-hidden="true">404</p>
      <h1 class="title">{{ t('notFound.title') }}</h1>
      <p class="subtitle">{{ t('notFound.description') }}</p>
      <router-link class="btn btn-primary" :to="{ name: 'home' }">
        {{ t('notFound.goHome') }}
      </router-link>
    </div>
  </div>
</template>
