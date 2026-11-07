<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue'
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
const dialog = useTemplateRef<HTMLElement>('dialog')
const cancelButton = useTemplateRef<HTMLButtonElement>('cancelButton')
let previouslyFocused: HTMLElement | null = null

function cancel() {
  if (!props.loading) emit('cancel')
}

// Keep Tab cycling inside the dialog while it is open.
function trapFocus(event: KeyboardEvent) {
  const buttons = Array.from(
    dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
  )
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  const active = document.activeElement

  if (!first || !last) {
    event.preventDefault()
    return
  }

  if (!dialog.value?.contains(active)) {
    event.preventDefault()
    first.focus()
  } else if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') cancel()
  else if (event.key === 'Tab') trapFocus(event)
}

onMounted(() => {
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  cancelButton.value?.focus()
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  if (previouslyFocused?.isConnected) previouslyFocused.focus()
})
</script>

<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="cancel">
    <div
      ref="dialog"
      class="modal-confirm"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <span class="modal-confirm-icon" aria-hidden="true">
        <img :src="trashIconUrl" alt="" width="20" height="20" />
      </span>

      <h2 :id="titleId" class="modal-confirm-title">{{ title }}</h2>

      <p class="modal-confirm-message">{{ message }}</p>
      <p v-if="subject" class="modal-confirm-subject">{{ subject }}</p>

      <div class="modal-confirm-actions">
        <button
          ref="cancelButton"
          type="button"
          class="btn-pill btn-pill-outline"
          :disabled="loading"
          @click="cancel"
        >
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
