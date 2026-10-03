import { useRouter } from 'vue-router'
import { useNodeStore } from '@/stores/note'
import { useToastStore } from '@/stores/toast'
import { FILE_ROUTE_PREFIX, fileRouteLocation } from '@/utils/file-navigation'
import { isMarkdownNode, isPreviewableImageNode } from '@/utils/file-node'
import { isPathInside, replacePathPrefix } from '@/utils/file-system'
import { loadWorkspaceFile, workspaceFilePath } from '@/router/workspace'
import type { FsNode, SelectedItem } from '@/types/file-system'

/** UI commands coordinate navigation; the store remains independent of Vue Router. */
export const useWorkspaceActions = () => {
  const router = useRouter()
  const store = useNodeStore()

  const openNode = async (node: FsNode): Promise<boolean> => {
    if (!isMarkdownNode(node)) {
      store.selectItem(node)
      if (node.type !== 'dir' && !isPreviewableImageNode(node)) {
        useToastStore().pushNotice('warning', 'The selected file cannot be opened.')
      }
      return true
    }
    if (workspaceFilePath(router.currentRoute.value) === node.path) {
      store.selectItem(node)
      return await loadWorkspaceFile(router, node.path)
    }
    return !await router.push(fileRouteLocation(node.path))
  }

  const createNode = async (name: string, type: 'file' | 'dir') => {
    const node = await store.addNewNode(name, type)
    await openNode(node)
  }

  const relocateRoute = async (oldPath: string, newPath: string) => {
    const path = workspaceFilePath(router.currentRoute.value)
    if (path && isPathInside(path, oldPath)) {
      await router.replace({
        ...fileRouteLocation(replacePathPrefix(path, oldPath, newPath)),
        query: router.currentRoute.value.query,
        hash: router.currentRoute.value.hash,
      })
    }
  }

  const renameNode = async (node: FsNode, name: string): Promise<void> => {
    const oldPath = node.path
    const newPath = await store.renameNode(node, name)
    await relocateRoute(oldPath, newPath)
  }

  const moveNode = async (node: FsNode, target: string): Promise<void> => {
    const oldPath = node.path
    const newPath = await store.moveNode(node, target)
    await relocateRoute(oldPath, newPath)
  }

  const deleteNode = async (item: SelectedItem): Promise<void> => {
    await store.deleteNode(item)
    const path = workspaceFilePath(router.currentRoute.value)
    if (path && isPathInside(path, item.path)) {
      await router.replace({ name: 'Workspace' })
    }
  }

  const followMarkdownLink = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
      || event.shiftKey || event.altKey || !(event.target instanceof Element)) return
    const link = event.target.closest<HTMLAnchorElement>('a[href]')
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
    const url = new URL(link.href)
    if (url.origin !== window.location.origin || !url.pathname.startsWith(FILE_ROUTE_PREFIX)) return
    event.preventDefault()
    void router.push(url.pathname + url.search + url.hash)
  }

  return { openNode, createNode, renameNode, moveNode, deleteNode, followMarkdownLink }
}
