import type { RouteRecordRaw } from 'vue-router'
import EditProject from '@/pages/project/Edit.vue'
import NewProject from '@/pages/project/New.vue'
import ProjectsIndex from '@/pages/project/Index.vue'
import ProjectSearch from '@/pages/project/Search.vue'

const projectsRoutes: RouteRecordRaw[] = [
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsIndex,
    meta: { requiresAuth: true, appHeader: true },
  },
  {
    path: '/projects/new',
    name: 'newProject',
    component: NewProject,
    meta: { requiresAuth: true, appHeader: true },
  },
  {
    path: '/projects/search',
    name: 'projectSearch',
    component: ProjectSearch,
    meta: { requiresAuth: true, appHeader: true },
  },
  {
    path: '/projects/:id/edit',
    name: 'editProject',
    component: EditProject,
    meta: { requiresAuth: true, appHeader: true },
  },
]

export default projectsRoutes
