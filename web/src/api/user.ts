import request from '@/scripts/utils/request'
import type { LoginResponse, ApiResponse } from '@/scripts/types'

export interface LoginForm {
  username: string
  password: string
  remember_me: boolean
}

/**
 * 登录接口
 */
export const loginApi = (
  data: LoginForm
): Promise<LoginResponse> => {
  const params = new URLSearchParams()
  params.append('grant_type', 'password')
  params.append('username', data.username)
  params.append('password', data.password)
  params.append('remember_me', String(data.remember_me))

  params.append('scope', '')
  params.append('client_id', 'string')
  params.append('client_secret', 'string')

  return request({
    url: '/api/v1/auth/login',
    method: 'post',
    data: params
  })
}

/**
 * 测试接口
 */
export function checkTokenApi(): Promise<ApiResponse<boolean>> {
  return request({
    url: '/api/v1/auth/check',
    method: 'get',
    data: {}
  })
}

/**
 * 登出接口
 */
export function logoutApi(): Promise<ApiResponse<string>> {
  return request({
    url: '/api/v1/auth/logout',
    method: 'post',
    data: {}
  })
}
