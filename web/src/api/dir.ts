import type { ApiResponse } from '@/types/api'
import type { FsNode } from '@/types/file-system'
import request from '@/utils/request'

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