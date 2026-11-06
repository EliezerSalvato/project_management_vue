<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onBeforeUnmount, onMounted, useId } from 'vue'
import trashIconUrl from '@/assets/icons/trash-light.svg'

const props = withDefaults(
  defineProps<{
    title: string
    message: string
    subject?: string
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
const titleId = useId()

function cancel() {
  if (!props.loading) emit('cancel')
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') cancel()
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="cancel">
    <div class="modal-confirm" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <span class="modal-confirm-icon" aria-hidden="true">
        <img :src="trashIconUrl" alt="" width="20" height="20" />
      </span>

      <h2 :id="titleId" class="modal-confirm-title">{{ title }}</h2>

      <p class="modal-confirm-message">{{ message }}</p>
      <p v-if="subject" class="modal-confirm-subject">{{ subject }}</p>

      <div class="modal-confirm-actions">
        <button type="button" class="btn-pill btn-pill-outline" :disabled="loading" @click="cancel">
          {{ t('buttons.cancel') }}
        </button>
        <button
          type="button"
          class="btn-pill"
          :class="{ 'btn-loading': loading }"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ t('buttons.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>
