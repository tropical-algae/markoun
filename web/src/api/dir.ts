import request from '@/scripts/utils/request'
import type { FsNode, ApiResponse } from '@/scripts/types'

/**
 * 创建文件夹接口
 */
export const createDirApi = (path: string, folderName: string): Promise<ApiResponse<FsNode>> => {
  return request({
    url: '/api/v1/dir/create',
    method: 'post',
    data: {
      path: path,
      name: folderName
    }
  })
}