import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import NotFound from '@/pages/NotFound.vue'
import usersRoutes from '@/router/users'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { requiresAuth: true },
    },
    ...usersRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFound,
    },
  ],
})

let sessionRestorePromise: Promise<void> | null = null

function restoreSession() {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return Promise.resolve()
  }

  if (!sessionRestorePromise) {
    sessionRestorePromise = authStore
      .refreshToken()
      .catch(() => {})
      .finally(() => {
        sessionRestorePromise = null
      })
  }

  return sessionRestorePromise
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()

  notificationStore.setCurrentMessage('')

  if (!authStore.isAuthenticated) {
    await restoreSession()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'signIn', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
