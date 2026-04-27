import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { useToastStore } from "@/stores/toast";

export interface RequestConfig extends AxiosRequestConfig {
  suppressErrorToast?: boolean;
}

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
    const requestConfig = (error?.config ?? {}) as RequestConfig
    const toastStore = useToastStore()
    const status = error?.response?.data?.status ?? error.code
    const message = error?.response?.data?.message ?? error.message
    if (!requestConfig.suppressErrorToast) {
      toastStore.pushNotice('error', `[ERROR]: ${message} (code: ${status})`)
    }
    return Promise.reject(error)
  }
)

const request = <T = any>(config: RequestConfig): Promise<T> => {
  return service.request<any, T>(config)
}

export default request
