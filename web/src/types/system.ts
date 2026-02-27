export const SysSettingType = {
  BOOL: 'bool',
  STR: 'str'
} as const;
export type SysSettingType = typeof SysSettingType[keyof typeof SysSettingType];

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

export interface SysNotice {
  id: number
  type: 'error' | 'warning' | 'info'
  message: string
}
