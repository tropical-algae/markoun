export interface FsNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  suffix: string;
  children?: FsNode[];
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
  status: string;
  filename: string;
}
