import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '@/pages/NotFound.vue'
import projectsRoutes from '@/router/projects'
import usersRoutes from '@/router/users'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    /** Render the shared top bar (logo + search) above the page. */
    appHeader?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: { name: 'projects' },
    },
    ...projectsRoutes,
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

  if (authStore.isAuthenticated || authStore.sessionChecked) {
    return Promise.resolve()
  }

  if (!sessionRestorePromise) {
    sessionRestorePromise = authStore
      .refreshToken()
      .catch(() => {})
      .finally(() => {
        authStore.markSessionChecked()
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
