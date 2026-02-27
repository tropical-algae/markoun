import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios"
import { useNoticeStore } from "@/stores/notice";


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
    return res 
  },
  (error: any) => {
    const noticeStore = useNoticeStore()
    const status = error?.response?.data?.status ?? error.code
    const message = error?.response?.data?.message ?? error.message
    noticeStore.pushNotice('error', `[ERROR]: ${message} (code: ${status})`)
    return Promise.reject(error)
  }
)

export default service