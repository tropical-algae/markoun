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
