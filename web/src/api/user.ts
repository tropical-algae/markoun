import request from '@/scripts/utils/request'
import type { LoginResponse } from '@/scripts/types'

export interface LoginForm {
  username: string
  password: string
}

/**
 * 登录接口
 */
export function login(data: LoginForm): Promise<LoginResponse> {
  const params = new URLSearchParams()
  params.append('grant_type', 'password')
  params.append('username', data.username)
  params.append('password', data.password)
  params.append('scope', '')
  params.append('client_id', 'string')
  params.append('client_secret', 'string')

  return request({
    url: '/api/v1/user/access-token',
    method: 'post',
    data: params
  })
}

/**
 * 测试接口
 */
export function testToken(): Promise<any> {
  return request({
    url: '/api/v1/user/test-token',
    method: 'post',
    data: {}
  })
}