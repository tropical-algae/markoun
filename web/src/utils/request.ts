import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import type { ApiResponse } from '@/types/api'

export interface RequestConfig<Data = unknown> extends AxiosRequestConfig<Data> {
  suppressErrorToast?: boolean;
}

export interface RequestError {
  status: number | string;
  message: string;
  raw: unknown;
  response?: ApiResponse;
}

type RequestErrorHandler = (error: RequestError) => void

let requestErrorHandler: RequestErrorHandler | null = null

export const setRequestErrorHandler = (handler: RequestErrorHandler | null) => {
  requestErrorHandler = handler
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true
})

const isApiResponse = (value: unknown): value is ApiResponse => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'status' in value && 'message' in value && 'data' in value
}

export const normalizeRequestError = (error: unknown): RequestError => {
  if (!axios.isAxiosError(error)) {
    return {
      status: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Request failed',
      raw: error,
    }
  }

  const axiosError = error as AxiosError<ApiResponse>
  const response = isApiResponse(axiosError.response?.data)
    ? axiosError.response.data
    : undefined

  return {
    status: response?.status ?? axiosError.response?.status ?? axiosError.code ?? 'UNKNOWN',
    message: response?.message ?? axiosError.message ?? 'Request failed',
    raw: error,
    response,
  }
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const requestConfig = axios.isAxiosError(error)
      ? (error.config ?? {}) as RequestConfig
      : {}
    const requestError = normalizeRequestError(error)

    if (!requestConfig.suppressErrorToast && requestErrorHandler) {
      requestErrorHandler(requestError)
    }

    return Promise.reject(error)
  }
)

const request = async <T = unknown, Data = unknown>(config: RequestConfig<Data>): Promise<T> => {
  const response = await service.request<T, AxiosResponse<T>, Data>(config)
  return response.data
}

export default request
