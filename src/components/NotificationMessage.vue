<script setup lang="ts">
import type { NotificationType } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import { computed, useSlots } from 'vue'

const props = defineProps<{
  type?: NotificationType
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = useSlots()
const notificationStore = useNotificationStore()
const { currentMessage, currentMessageType, messageKey } = storeToRefs(notificationStore)

const isLocal = computed(() => Boolean(slots.default))
const currentType = computed(() => props.type || currentMessageType.value)
const typeClass = computed(() =>
  currentType.value === 'danger' ? 'notification-danger' : 'notification-success',
)
const icon = computed(() => (currentType.value === 'danger' ? '✕' : '✓'))

function close() {
  emit('close')

  if (!isLocal.value) {
    notificationStore.setCurrentMessage('')
  }
}
</script>

<template>
  <div v-if="isLocal" class="notification" :class="typeClass">
    <button type="button" class="close-button" :aria-label="'close'" @click="close"></button>
    <slot />
  </div>

  <div v-else class="notification-stack" aria-live="polite">
    <Transition name="notification" mode="out-in">
      <div
        v-if="currentMessage"
        :key="messageKey"
        class="notification notification-toast"
        :class="typeClass"
        role="status"
      >
        <span class="notification-icon" aria-hidden="true">{{ icon }}</span>
        <p class="notification-text">{{ currentMessage }}</p>
        <button type="button" class="close-button" :aria-label="'close'" @click="close"></button>
        <span class="notification-progress" @animationend="close"></span>
      </div>
    </Transition>
  </div>
</template>
