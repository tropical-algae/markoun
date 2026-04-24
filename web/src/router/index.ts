import { createRouter, createWebHistory } from "vue-router"
import { useUserStore } from '@/stores/user'
import { buildLoginRedirectLocation, resolvePostAuthRedirect } from '@/router/auth'

const Workspace = () => import("@/views/Workspace.vue")
const Login = () => import("@/views/Login.vue")


const siteTitle = import.meta.env.VITE_SITE_TITLE || 'My Blog';
const routes = [
  {
    path: "/",
    name: "Workspace",
    components: {
      default: Workspace,
    },
    meta: {
      requiresAuth: true,
      "title": 'Timeline - ' + siteTitle
    }
  },
  {
    path: "/login",
    name: "Login",
    components: {
      default: Login,
    },
    meta: {
      guestOnly: true,
      "title": 'Timeline - ' + siteTitle
    }
  },
  {
    path: '/:pathMatch(.*)*', 
    redirect: '/' 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

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

export default router
