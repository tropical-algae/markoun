import type { ApiResponse } from '@/types/api'
import type { FileDetailResponse, FsNode, UploadResponse } from '@/types/file-system'
import request from '@/utils/request'

/**
 * 获取文件信息接口
 */
export const getFileContentApi = (
  filepath: string
): Promise<ApiResponse<FileDetailResponse>> => {
  return request({
    url: '/api/v1/file/load',
    method: 'get',
    params: {
      filepath: filepath
    }
  })
}

/**
 * 创建笔记接口
 */
export const createNoteApi = (
  path: string, 
  fileName: string
): Promise<ApiResponse<FsNode>> => {
  return request({
    url: '/api/v1/file/create',
    method: 'post',
    data: {
      path: path,
      name: fileName
    }
  })
}

/**
 * 上传文件
 */
export const uploadFileApi = (
  path: string, 
  file: File, 
  onProgress?: (percent: number) => void
): Promise<ApiResponse<UploadResponse>> => {
  
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
 * 更新文件内容
 */
export const saveNoteApi = (
  path: string, 
  content: string
): Promise<ApiResponse<Record<string, string>>> => {
  return request({
    url: '/api/v1/file/save',
    method: 'post',
    data: {
      filepath: path,
      content: content
    }
  })
}

