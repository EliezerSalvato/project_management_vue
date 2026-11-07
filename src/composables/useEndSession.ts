import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'

/** Logs out after a credential change and shows `notice` on the sign in page. */
export function useEndSession() {
  const router = useRouter()
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()

  return async function endSessionAndRedirect(notice: string) {
    try {
      await authStore.logout()
    } catch {
      // logout() already clears the local state when revoking fails
    }

    await router.push({ name: 'signIn' })
    notificationStore.setCurrentMessage(notice, 'success')
  }
}
