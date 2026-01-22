export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface LoginResponse {
  user_id: string
  access_token: string
  token_type: string
  message: string
  timestamp: string
  scopes: string[]
  status: number
}
