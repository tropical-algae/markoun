import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  ApiKeyCreateRequest,
  ApiKeyCreated,
  ApiKeyInfo,
} from '@/types/api-key'

export const getApiKeysApi = (): Promise<ApiResponse<ApiKeyInfo[]>> => {
  return request({
    url: '/api/v1/api-keys',
    method: 'get',
  })
}

export const createApiKeyApi = (
  data: ApiKeyCreateRequest,
): Promise<ApiResponse<ApiKeyCreated>> => {
  return request({
    url: '/api/v1/api-keys',
    method: 'post',
    data,
    suppressErrorToast: true,
  })
}

export const revokeApiKeyApi = (keyId: string): Promise<ApiResponse<string>> => {
  return request({
    url: `/api/v1/api-keys/${keyId}`,
    method: 'delete',
    suppressErrorToast: true,
  })
}
