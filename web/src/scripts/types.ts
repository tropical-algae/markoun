export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
}

export interface LoginResponse {
  user_id: string
  message: string
  timestamp: string
  scopes: string[]
  status: number
}

export interface User {
  id: string
  email: string
  scopes: string
  full_name: string | null
  is_active: boolean | null
  is_superuser: boolean | null
  create_date: string | null
  profile: string | null
}