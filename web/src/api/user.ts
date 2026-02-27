import type { ApiResponse } from '@/types/api'
import type { LoginForm, LoginResponse, RegisterForm } from '@/types/auth'
import request from '@/utils/request'

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
 * 注册接口
 */
export const registerApi = (
  data: RegisterForm
): Promise<LoginResponse> => {
  return request({
    url: '/api/v1/auth/register',
    method: 'post',
    data: {
      "full_name": data.username,
      "password": data.password,
      "email": data.email
    }
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

/**
 * 更新密码
 */
export const updatePasswordApi = (newPasswd: string): Promise<ApiResponse<string>> => {
  return request({
    url: '/api/v1/auth/password',
    method: 'patch',
    params: {
      new_passwd: newPasswd,
    }
  })
}
