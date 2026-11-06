<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'
import trashIconUrl from '@/assets/icons/trash.svg'
import uploadIconUrl from '@/assets/icons/upload.svg'

defineProps<{
  label: string
  hint: string
  selectLabel: string
  removeLabel: string
  previewAlt: string
  previewUrl: string | null
  error?: string
}>()

const emit = defineEmits<{
  select: [file: File]
  clear: []
}>()

const input = useTemplateRef<HTMLInputElement>('input')
const id = useId()
const errorId = `${id}-error`

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  target.value = ''

  if (file) emit('select', file)
}
</script>

<template>
  <div class="form-field cover-upload">
    <label class="form-label" :for="id">{{ label }}</label>

    <div v-if="previewUrl" class="cover-upload-preview">
      <img class="cover-upload-image" :src="previewUrl" :alt="previewAlt" />
      <button
        type="button"
        class="cover-upload-remove"
        :aria-label="removeLabel"
        @click="emit('clear')"
      >
        <img :src="trashIconUrl" alt="" width="18" height="18" />
      </button>
    </div>

    <div v-else class="cover-upload-drop" :class="{ 'cover-upload-drop-error': error }">
      <img :src="uploadIconUrl" alt="" width="26" height="26" />
      <p>{{ hint }}</p>
      <button type="button" class="btn-pill btn-pill-outline" @click="input?.click()">
        {{ selectLabel }}
      </button>
    </div>

    <input
      :id="id"
      ref="input"
      type="file"
      class="cover-upload-input"
      tabindex="-1"
      accept=".jpg,.jpeg,.png"
      :aria-describedby="errorId"
      @change="onChange"
    />
    <p :id="errorId" class="form-help-error">{{ error }}</p>
  </div>
</template>
