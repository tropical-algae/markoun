import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios"
import { useUserStore } from "@/scripts/stores/user"


const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers = config.headers || {} 
      config.headers["Authorization"] = `Bearer ${userStore.token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.status === 200 || res.message === "success") {
      return res 
    } else {
      console.error("Error:", res.message)
      return Promise.reject(new Error(res.message || "Error"))
    }
  },
  (error: any) => {
    // if (error.response && error.response.status === 401) {
    //   const userStore = useUserStore()
    //   userStore.logout()
    // }
    return Promise.reject(error)
  }
)

export default service