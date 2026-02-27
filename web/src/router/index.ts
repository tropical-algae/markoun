import { createRouter, createWebHistory } from "vue-router"
import { useUserStore } from '@/stores/user'

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

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  
  const isAuthenticated = await userStore.checkAuth() 

  if (to.name !== 'Login' && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Workspace' })
  } else {
    next()
  }
})

export default router