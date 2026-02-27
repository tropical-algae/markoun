import type { ApiResponse } from '@/types/api'
import type { FsNode } from '@/types/file-system'
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
 * 获取文件树接口
 */
export const getFileTreeApi = (): Promise<ApiResponse<FsNode[]>> => {
  return request({
    url: '/api/v1/item/tree',
    method: 'get',
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
