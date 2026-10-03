import { createRouter, createWebHistory } from 'vue-router'
import { useSysStore } from '@/stores/system'
import { useUserStore } from '@/stores/user'
import { buildLoginRedirectLocation, resolvePostAuthRedirect } from '@/router/auth'
import { installWorkspaceNavigation } from '@/router/workspace'
import { FILE_ROUTE_PREFIX } from '@/utils/file-navigation'

const Workspace = () => import('@/views/Workspace.vue')
const Login = () => import('@/views/Login.vue')

const siteTitle = import.meta.env.VITE_SITE_TITLE || 'My Blog'
const routes = [
  {
    path: '/',
    name: 'Workspace',
    components: {
      default: Workspace,
    },
    meta: {
      requiresAuth: true,
      workspace: true,
      title: `Timeline - ${siteTitle}`,
    },
  },
  {
    path: `${FILE_ROUTE_PREFIX}:path(.*)+`,
    name: 'WorkspaceFile',
    component: Workspace,
    meta: {
      requiresAuth: true,
      workspace: true,
      title: `Timeline - ${siteTitle}`,
    },
  },
  {
    path: '/login',
    name: 'Login',
    components: {
      default: Login,
    },
    meta: {
      guestOnly: true,
      title: `Timeline - ${siteTitle}`,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const sysStore = useSysStore()
  const userStore = useUserStore()

  if (to.meta.requiresAuth || to.meta.guestOnly) {
    try {
      await sysStore.ensureSysStatus()
    } catch (_) {
    }
  }

  if (!sysStore.authRequired) {
    if (to.meta.guestOnly) {
      return resolvePostAuthRedirect(to.query.redirect)
    }
    return true
  }

  if (to.meta.requiresAuth || to.meta.guestOnly) {
    await userStore.ensureAuthKnown()
  }

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return buildLoginRedirectLocation(to)
  }

  if (to.meta.guestOnly && userStore.isAuthenticated) {
    return resolvePostAuthRedirect(to.query.redirect)
  }

  return true
})

installWorkspaceNavigation(router)

export default router
