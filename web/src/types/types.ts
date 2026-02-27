export const SidebarMode = {
  FileTree: 'fileTree',
  Settings: 'settings',
} as const;
export type SidebarMode = typeof SidebarMode[keyof typeof SidebarMode];

export const InspectMode = {
  Meta: 'meta',
  Preview: 'preview'
} as const;
export type InspectMode = typeof InspectMode[keyof typeof InspectMode];

export const SysSettingType = {
  BOOL: 'bool',
  STR: 'str'
} as const;
export type SysSettingType = typeof SysSettingType[keyof typeof SysSettingType];

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

export interface LoginForm {
  username: string
  password: string
  remember_me: boolean
}

export interface RegisterForm {
  username: string
  email: string
  password: string
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

export interface LoginResponse {
  user_id: string;
  message: string;
  timestamp: string;
  scopes: string[];
  status: number;
}

export interface FileDetailResponse {
  content: string;
  meta: Record<string, string>;
}

export interface UploadResponse {
  status: string;
  filename: string;
}

export interface SysStatusResponse {
  status: string;
  version: string;
}

export interface BaseSysSetting {
  id: string;
  name: string;
  desc: string;
}

export interface BoolSysSetting extends BaseSysSetting {
  type: typeof SysSettingType.BOOL;
  value: boolean;
}

export interface StrSysSetting extends BaseSysSetting {
  type: typeof SysSettingType.STR;
  value: string;
}

export type SysSettingResponse =
  | BoolSysSetting
  | StrSysSetting;

// type wrapper
export interface FileDetail {
  name: string;
  path: string;
  suffix: string;
  content: string;
  meta: Record<string, string>;
}

export interface SysNotice {
  id: number
  type: 'error' | 'warning' | 'info'
  message: string
}
