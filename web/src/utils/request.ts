import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import type { ApiResponse } from '@/types/api'
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
  (error: unknown) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    return res 
  },
  (error: unknown) => {
    const axiosError = error as AxiosError<ApiResponse>
    const requestConfig = (axiosError.config ?? {}) as RequestConfig
    const toastStore = useToastStore()
    const status = axiosError.response?.data?.status ?? axiosError.code
    const message = axiosError.response?.data?.message ?? axiosError.message
    if (!requestConfig.suppressErrorToast) {
      toastStore.pushNotice('error', `[ERROR]: ${message} (code: ${status})`)
    }
    return Promise.reject(error)
  }
)

const request = <T = unknown>(config: RequestConfig): Promise<T> => {
  return service.request<unknown, T>(config)
}

export default request
