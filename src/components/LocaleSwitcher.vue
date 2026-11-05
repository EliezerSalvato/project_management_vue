<script setup lang="ts">
import type { AppLocale } from '@/locales/locale'
import { applyAppLocale, syncProfileLocale } from '@/composables/useProfileLocaleSync'
import { useI18n } from 'vue-i18n'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const { locale } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

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

function onDocumentPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
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

    <div v-show="open" class="dropdown-menu" role="menu">
      <button
        v-for="option in options"
        :key="option.code"
        type="button"
        class="dropdown-item"
        :class="{ 'dropdown-item-active': locale === option.code }"
        @click="selectLocale(option.code)"
      >
        <span class="locale-flag" aria-hidden="true">{{ option.flag }}</span>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
