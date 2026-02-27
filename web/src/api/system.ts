import type { ApiResponse } from '@/types/api'
import type { SysSettingResponse, SysStatusResponse } from '@/types/system'
import request from '@/utils/request'

/**
 * 查看系统状态
 */
export const checkSystemStatusApi = (
): Promise<ApiResponse<SysStatusResponse>> => {
  return request({
    url: '/api/v1/system/status',
    method: 'get'
  })
}

/**
 * 获取可编辑的系统设置
 */
export const getAvailableSettingApi = (): Promise<ApiResponse<SysSettingResponse[]>> => {
  return request({
    url: '/api/v1/system/settings',
    method: 'get'
  })
}

/**
 * 更新系统设置
 */
export const updateSettingApi = (id: string, value: string | boolean): Promise<ApiResponse<string>> => {
  return request({
    url: '/api/v1/system/settings',
    method: 'patch',
    data: {
        id: id,
        value: value
    }
  })
}

/**
 * 更新系统设置
 */
export const isAllowRegisterApi = (): Promise<ApiResponse<boolean>> => {
  return request({
    url: '/api/v1/system/settings/allow-register',
    method: 'get',
  })
}
