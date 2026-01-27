import request from '@/scripts/utils/request'
import type { FsNode, FileDetailResponse, ApiResponse } from '@/scripts/types'


/**
 * 获取文件树接口
 */
export function getFileTreeReq(): Promise<ApiResponse<FsNode[]>> {
  return request({
    url: '/api/v1/file/tree',
    method: 'get',
  })
}

/**
 * 获取文件信息接口
 */
export function getFileDetailReq(filepath: string): Promise<ApiResponse<FileDetailResponse>> {
  return request({
    url: '/api/v1/file/load-note',
    method: 'get',
    params: {
      filepath: filepath
    }
  })
}

/**
 * 创建笔记接口
 */
export function createNoteReq(path: string, fileName: string): Promise<ApiResponse<FsNode>> {
  return request({
    url: '/api/v1/file/create-note',
    method: 'post',
    data: {
      path: path,
      name: fileName
    }
  })
}

/**
 * 创建笔记接口
 */
export function createFolderReq(path: string, folderName: string): Promise<ApiResponse<FsNode>> {
  return request({
    url: '/api/v1/file/create-folder',
    method: 'post',
    data: {
      path: path,
      name: folderName
    }
  })
}
