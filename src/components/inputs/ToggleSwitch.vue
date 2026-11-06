<script setup lang="ts">
defineProps<{
  label: string
}>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="toggle-switch">
    <input v-model="model" type="checkbox" role="switch" class="toggle-switch-input" />
    <span class="toggle-switch-track" aria-hidden="true" />
    <span>{{ label }}</span>
  </label>
</template>
