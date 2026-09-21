import type { ApiResponse } from '@/types/api'
import type { HistoryRevision, HistoryTree } from '@/types/history'
import request from '@/utils/request'

export const getHistoryTreeApi = (
  filepath: string,
): Promise<ApiResponse<HistoryTree>> => {
  return request({
    url: '/api/v1/history/tree',
    method: 'get',
    params: { filepath },
    suppressErrorToast: true,
  })
}

export const getHistoryRevisionApi = (
  filepath: string,
  revisionId: string,
): Promise<ApiResponse<HistoryRevision>> => {
  return request({
    url: '/api/v1/history/revision',
    method: 'get',
    params: {
      filepath,
      revision_id: revisionId,
    },
  })
}

export const deleteHistoryRevisionApi = (
  filepath: string,
  revisionId: string,
): Promise<ApiResponse<HistoryTree>> => {
  return request({
    url: '/api/v1/history/revision',
    method: 'delete',
    data: {
      filepath,
      revision_id: revisionId,
    },
  })
}
