import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      svgLoader()
    ],
    server: {
      host: "0.0.0.0",
      port: parseInt(env.VITE_WEB_PORT) || 8000,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    }
  }
})

