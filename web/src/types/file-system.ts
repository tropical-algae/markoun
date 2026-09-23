export type DirectoryLoadState = 'idle' | 'loading' | 'loaded' | 'error'

export interface DirectoryRecord {
  status: DirectoryLoadState
  children: FsNode[] | null
  error: unknown | null
}

export type DirectoryRenderState = 'collapsed' | 'loading' | 'error' | 'content' | 'empty'

export interface FsNode {
  name: string
  path: string
  type: 'file' | 'dir'
  suffix: string
  has_children?: boolean | null
  children?: FsNode[]
}

export interface DirectoryChildrenResponse {
  path: string
  children: FsNode[]
}

export interface FileDetail {
  name: string
  path: string
  suffix: string
  content: string
  meta: Record<string, string>
}

export interface FileDetailResponse {
  content: string
  meta: Record<string, string>
  history_enabled: boolean
  default_revision_id: string | null
}

export interface FileSaveResponse {
  path: string
  suffix: string
  size: string
  modified: string
  changed: string
  accessed: string
  history_enabled: boolean
  revision_id: string | null
  default_revision_id: string | null
}

export interface FileSearchMatch {
  snippet: string
  line: number
}

export interface FileSearchResult {
  node: FsNode
  matches: FileSearchMatch[]
}

export interface UploadResponse {
  filename: string
  path: string
  node: FsNode | null
}

export interface PastedImageResponse extends UploadResponse {
  markdown_path: string
  created_directory: FsNode | null
}
