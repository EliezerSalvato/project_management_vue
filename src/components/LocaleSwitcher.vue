<script setup lang="ts">
import type { AppLocale } from '@/locales/locale'
import { useClickOutside } from '@/composables/useClickOutside'
import { useI18n } from 'vue-i18n'
import { applyAppLocale, syncProfileLocale } from '@/composables/useProfileLocaleSync'
import { computed, ref, useTemplateRef } from 'vue'

const { locale } = useI18n()
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')

const options: { code: AppLocale; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'English (United States)' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português (Brasil)' },
]

const current = computed(() => options.find((option) => option.code === locale.value) ?? options[0])

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function selectLocale(next: AppLocale) {
  if (locale.value !== next) {
    applyAppLocale(next)
    void syncProfileLocale(next)
  }

  close()
}

useClickOutside(root, close, open)
</script>

<template>
  <div ref="root" class="locale-switcher">
    <button
      type="button"
      class="navbar-item locale-flag"
      :aria-expanded="open"
      aria-haspopup="true"
      :aria-label="current?.label ?? ''"
      @click="toggle"
    >
      <span aria-hidden="true">{{ current?.flag }}</span>
    </button>

    <div v-show="open" class="project-card-menu-list" role="menu">
      <button
        v-for="option in options"
        :key="option.code"
        type="button"
        class="project-card-menu-item"
        :class="{ 'locale-option-active': locale === option.code }"
        role="menuitem"
        @click="selectLocale(option.code)"
      >
        <span class="locale-flag" aria-hidden="true">{{ option.flag }}</span>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
