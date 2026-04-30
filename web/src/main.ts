import { createApp } from "vue"
import { createPinia } from 'pinia'
import "@/assets/styles/main.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import App from "@/App.vue"
import router from "@/router/index"
import { useToastStore } from "@/stores/toast"
import { setRequestErrorHandler } from "@/utils/request"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

setRequestErrorHandler((error) => {
  const toastStore = useToastStore(pinia)
  toastStore.pushNotice('error', `[ERROR]: ${error.message} (code: ${error.status})`)
})

app.mount('#app')
