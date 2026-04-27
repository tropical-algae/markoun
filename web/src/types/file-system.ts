export type DirectoryLoadState = 'idle' | 'loading' | 'loaded' | 'error';

export interface FsNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  suffix: string;
  has_children?: boolean | null;
  children?: FsNode[];
}

export interface DirectoryChildrenResponse {
  path: string;
  children: FsNode[];
}

export interface FileDetail {
  name: string;
  path: string;
  suffix: string;
  content: string;
  meta: Record<string, string>;
}

export interface FileDetailResponse {
  content: string;
  meta: Record<string, string>;
}

export interface UploadResponse {
  filename: string;
  node: FsNode | null;
}
