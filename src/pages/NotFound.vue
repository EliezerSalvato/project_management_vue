<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
  <div class="project-page">
    <section class="project-empty">
      <p class="not-found-code" aria-hidden="true">404</p>
      <h1 class="project-empty-title">{{ t('notFound.title') }}</h1>
      <p class="project-empty-description">{{ t('notFound.description') }}</p>
      <RouterLink class="btn-pill btn-pill-lg" :to="{ name: 'home' }">
        {{ t('notFound.goHome') }}
      </RouterLink>
    </section>
  </div>
</template>
