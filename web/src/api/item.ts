import request from '@/scripts/utils/request'
import type { FsNode, ApiResponse } from '@/scripts/types'

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