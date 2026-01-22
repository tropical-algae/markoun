import { createApp } from "vue"
import "@/assets/styles/main.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import App from "@/App.vue"
// import router from "@/router/index"

const app = createApp(App)

// app.use(router)

app.mount('#app')
