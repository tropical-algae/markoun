import { inject, type InjectionKey, type Ref } from 'vue'

export interface WorkspaceLayoutContext {
  isCompactLayout: Readonly<Ref<boolean>>
  isSidebarPanelOpen: Ref<boolean>
  setSidebarPanelOpen: (value: boolean) => void
  closeSidebarPanelOnCompact: () => void
}

export const workspaceLayoutKey: InjectionKey<WorkspaceLayoutContext> =
  Symbol('workspace-layout')

export const useWorkspaceLayout = () => {
  const context = inject(workspaceLayoutKey)
  if (!context) {
    throw new Error('useWorkspaceLayout must be used inside WorkspaceLayout.')
  }
  return context
}
