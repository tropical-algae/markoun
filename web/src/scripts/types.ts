// API response
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
}

export interface FsNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  suffix: string;
  children?: FsNode[];
}


export interface LoginResponse {
  user_id: string;
  message: string;
  timestamp: string;
  scopes: string[];
  status: number;
}

export interface User {
  id: string;
  email: string;
  scopes: string;
  full_name: string | null;
  is_active: boolean | null;
  is_superuser: boolean | null;
  create_date: string | null;
  profile: string | null;
}

export interface FileDetailResponse {
  content: string;
  meta: Record<string, string>;
}

// type wrapper
export interface FileDetail {
  name: string;
  path: string;
  suffix: string;
  content: string;
  meta: Record<string, string>;
}
