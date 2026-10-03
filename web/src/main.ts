import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/styles/main.css'

import App from '@/App.vue'
import router from '@/router'
import { buildLoginRedirectLocation } from '@/router/auth'
import { useToastStore } from '@/stores/toast'
import { useAppearanceStore } from '@/stores/appearance'
import { useUserStore } from '@/stores/user'
import { setRequestErrorHandler } from '@/utils/request'

const app = createApp(App)
const pinia = createPinia()
const appearanceStore = useAppearanceStore(pinia)

app.use(pinia)
app.use(router)

appearanceStore.initAppearance()

setRequestErrorHandler((error) => {
  if (error.status === 401) {
    useUserStore(pinia).handleUnauthorized()
    if (router.currentRoute.value.meta.workspace) {
      void router.replace(buildLoginRedirectLocation(router.currentRoute.value))
    }
  }
  const toastStore = useToastStore(pinia)
  toastStore.pushNotice('error', `[ERROR]: ${error.message} (code: ${error.status})`)
})

app.mount('#app')
