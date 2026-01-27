import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios"
import { useNoticeStore } from "@/scripts/stores/notice";


const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
      const noticeStore = useNoticeStore()
      noticeStore.pushNotice('error', `ERROR[${res.status}]: ${res.message}`)

      console.error("Error:", res.message)
      return Promise.reject(new Error(res.message || "Error"))
    }
  },
  (error: any) => {
    const noticeStore = useNoticeStore()
    noticeStore.pushNotice('error', `[ERROR]: ${error}`)
    return Promise.reject(error)
  }
)

export default service