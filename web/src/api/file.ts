import request from '@/scripts/utils/request'
import type { FsNode, FileDetailResponse, UploadResponse, ApiResponse } from '@/scripts/types'


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

/**
 * 上传文件
 */
export function uploadFileReq(
  path: string, 
  file: File, 
  onProgress?: (percent: number) => void
): Promise<ApiResponse<UploadResponse>> {
  
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/api/v1/file/upload',
    method: 'post',
    params: {
      path: path
    },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    }
  })
}

/**
 * 删除文件 / 目录
 */
export function deletedItemReq(path: string): Promise<ApiResponse<string>> {
  return request({
    url: '/api/v1/file/remove',
    method: 'post',
    params: {
      filepath: path
    }
  })
}

/**
 * 更新文件内容
 */
export function saveNoteReq(path: string, content: string): Promise<ApiResponse<Record<string, string>>> {
  return request({
    url: '/api/v1/file/save',
    method: 'post',
    data: {
      filepath: path,
      content: content
    }
  })
}

