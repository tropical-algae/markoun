import type { ApiResponse } from '@/types/api'
import type { DirectoryChildrenResponse } from '@/types/file-system'
import request from '@/utils/request'

/**
 * 删除文件 / 目录
 */
export const removeItemApi = (
    path: string
): Promise<ApiResponse<string>> => {
  return request({
    url: '/api/v1/item/remove',
    method: 'post',
    params: {
      filepath: path
    }
  })
}

/**
 * 获取目录直接子项
 */
export const getDirectoryChildrenApi = (
  path: string = '.'
): Promise<ApiResponse<DirectoryChildrenResponse>> => {
  return request({
    url: '/api/v1/item/children',
    method: 'get',
    params: {
      path
    }
  })
}

/**
 * 重命名文件/文件夹
 */
export const renameItemApi = (
  path: string, 
  new_name: string
): Promise<ApiResponse<string>> => {
  return request({
    url: '/api/v1/item/rename',
    method: 'post',
    data: {
      path: path,
      new_name: new_name
    }
  })
}
