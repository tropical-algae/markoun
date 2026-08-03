export const SidebarMode = {
  FileTree: 'fileTree',
  Search: 'search',
  User: 'user',
  Settings: 'settings',
} as const
export type SidebarMode = typeof SidebarMode[keyof typeof SidebarMode]

export const InspectorMode = {
  Meta: 'meta',
  Preview: 'preview',
} as const
export type InspectorMode = typeof InspectorMode[keyof typeof InspectorMode]
