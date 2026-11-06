import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'danger' | 'success'

export const useNotificationStore = defineStore('notification', () => {
  const currentMessage = ref('')
  const currentMessageType = ref<NotificationType>('success')
  // Bumped on every message so repeating the same text still restarts the toast.
  const messageKey = ref(0)

  function setCurrentMessage(message: string, type?: NotificationType) {
    currentMessage.value = message
    messageKey.value++

    if (type) {
      currentMessageType.value = type
    }
  }

  return {
    currentMessage,
    currentMessageType,
    messageKey,
    setCurrentMessage,
  }
})
