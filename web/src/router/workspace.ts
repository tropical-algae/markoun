import type { RouteLocationNormalized, Router } from 'vue-router'
import { useSysStore } from '@/stores/system'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import { normalizeRequestError, reportRequestError } from '@/utils/request'
import { normalizeFilePath } from '@/utils/file-navigation'
import { fileNodeFromPath } from '@/utils/file-node'
import type { useNodeStore } from '@/stores/note'

type NoteStore = ReturnType<typeof useNodeStore>

// Keep the editor and Markdown renderer out of the login page's initial bundle.
const getNoteStore = async () => (await import('@/stores/note')).useNodeStore()

export const workspaceFilePath = (route: RouteLocationNormalized): string | null => {
  if (route.name !== 'WorkspaceFile') return null
  const path = route.params.path
  return normalizeFilePath(Array.isArray(path) ? path.join('/') : path ?? '')
}

export const loadWorkspaceFile = async (
  router: Router,
  path: string,
  noteStore?: NoteStore,
): Promise<boolean> => {
  const store = noteStore ?? await getNoteStore()
  if (!router.currentRoute.value.meta.workspace || workspaceFilePath(router.currentRoute.value) !== path) {
    return false
  }
  try {
    return await store.loadFile(path)
  } catch (error) {
    // A late failure must not redirect a newer navigation, even after another file opens.
    if (!router.currentRoute.value.meta.workspace || workspaceFilePath(router.currentRoute.value) !== path) {
      return false
    }
    const failure = normalizeRequestError(error)
    if (failure.status === 404) {
      useToastStore().pushNotice('warning', 'File not found.')
      await router.replace({ name: 'Workspace' })
    } else {
      reportRequestError(error)
    }
    return false
  }
}

export const installWorkspaceNavigation = (router: Router) => {
  let store: NoteStore | undefined
  router.beforeResolve(async (to, from) => {
    let target: string | null
    try {
      target = workspaceFilePath(to)
    } catch {
      useToastStore().pushNotice('warning', 'Invalid file path.')
      return { name: 'Workspace', replace: true }
    }
    if (!to.meta.workspace && !from.meta.workspace) return
    store = await getNoteStore()
    if (!from.meta.workspace) return
    // Relocating the current file changes its URL, not its editing session.
    const currentPath = store.hasCurrentFile ? store.currentFile.path : null
    if (to.meta.workspace && target === currentPath) return
    if (useSysStore().authRequired && !useUserStore().isAuthenticated) return
    try {
      await store.saveCurrentFileIfDirty()
    } catch {
      // Keep the route, selection and draft when saving fails. The request layer reports it.
      return false
    }
  })

  router.afterEach((to, from, failure) => {
    if (failure || !store) return
    if (!to.meta.workspace) {
      if (from.meta.workspace) store.resetWorkspaceState()
      return
    }
    const path = workspaceFilePath(to)
    if (from.meta.workspace && path === workspaceFilePath(from)) return
    if (path) {
      if (path !== store.currentFile.path) store.selectItem(fileNodeFromPath(path))
      void loadWorkspaceFile(router, path, store)
    } else {
      store.showWelcome()
      void store.ensureWelcomeNoteLoaded().catch(() => null)
    }
  })
}
