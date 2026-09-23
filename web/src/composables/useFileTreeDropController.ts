import {
  computed,
  onBeforeUnmount,
  provide,
  inject,
  ref,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { useFileUploadTask } from '@/composables/useFileUploadTask'
import {
  FILE_TREE_NODE_MIME,
  getActiveDraggedTreeNode,
  readDraggedTreeNode,
} from '@/composables/useFileTreeNodeDrag'
import type { FsNode } from '@/types/file-system'
import {
  getParentPath,
  isPathInside,
  normalizeNodePath,
  ROOT_DIRECTORY_PATH,
} from '@/utils/file-system'

interface FileTreeDropContext {
  activeDropPath: Readonly<Ref<string | null>>
}

interface FileTreeDropControllerOptions {
  rootElement: Readonly<Ref<HTMLElement | null>>
  moveNode: (node: FsNode, targetDir: string) => Promise<void>
  selectDirectory: (path: string) => Promise<void>
}

interface ResolvedDrop {
  kind: 'file' | 'node'
  node: FsNode | null
  targetPath: string
}

const fileTreeDropKey: InjectionKey<FileTreeDropContext> = Symbol('file-tree-drop')

const hasDataType = (event: DragEvent, type: string): boolean => {
  const types = event.dataTransfer?.types
  return Boolean(types && Array.from(types).includes(type))
}

const canMoveNodeToTarget = (node: FsNode, targetPath: string): boolean => {
  const sourcePath = normalizeNodePath(node.path)
  if (sourcePath === targetPath || getParentPath(sourcePath) === targetPath) {
    return false
  }
  return node.type !== 'dir' || !isPathInside(targetPath, sourcePath)
}

export const provideFileTreeDropController = (options: FileTreeDropControllerOptions) => {
  const uploadTask = useFileUploadTask()
  const activeDropPath = ref<string | null>(null)
  let leaveFrame: number | null = null

  provide(fileTreeDropKey, { activeDropPath })

  const cancelScheduledLeave = () => {
    if (leaveFrame !== null) {
      cancelAnimationFrame(leaveFrame)
      leaveFrame = null
    }
  }

  const clearDropTarget = () => {
    cancelScheduledLeave()
    activeDropPath.value = null
  }

  const resolveTargetPath = (event: DragEvent): string => {
    const eventTarget = event.target
    if (!(eventTarget instanceof Element)) {
      return ROOT_DIRECTORY_PATH
    }
    const dropTarget = eventTarget.closest<HTMLElement>('[data-tree-drop-path]')
    return normalizeNodePath(dropTarget?.dataset.treeDropPath)
  }

  const resolveDrop = (event: DragEvent): ResolvedDrop | null => {
    const targetPath = resolveTargetPath(event)
    if (hasDataType(event, 'Files')) {
      return { kind: 'file', node: null, targetPath }
    }

    if (!getActiveDraggedTreeNode() && !hasDataType(event, FILE_TREE_NODE_MIME)) {
      return null
    }
    const node = readDraggedTreeNode(event)
    if (!node || !canMoveNodeToTarget(node, targetPath)) {
      return null
    }
    return { kind: 'node', node, targetPath }
  }

  const handleDragOver = (event: DragEvent) => {
    cancelScheduledLeave()
    const drop = resolveDrop(event)
    if (!drop || !event.dataTransfer) {
      activeDropPath.value = null
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = drop.kind === 'file' ? 'copy' : 'move'
    activeDropPath.value = drop.targetPath
  }

  const handleDragLeave = (event: DragEvent) => {
    cancelScheduledLeave()
    const rootElement = options.rootElement.value
    const { clientX, clientY } = event
    leaveFrame = requestAnimationFrame(() => {
      leaveFrame = null
      const elementAtPointer = document.elementFromPoint(clientX, clientY)
      if (rootElement && elementAtPointer && rootElement.contains(elementAtPointer)) {
        return
      }
      activeDropPath.value = null
    })
  }

  const handleDrop = async (event: DragEvent) => {
    const drop = resolveDrop(event)
    clearDropTarget()
    if (!drop) {
      return
    }

    event.preventDefault()
    if (drop.kind === 'node' && drop.node) {
      await options.moveNode(drop.node, drop.targetPath)
      return
    }

    const file = event.dataTransfer?.files?.[0]
    if (!file) {
      return
    }
    await options.selectDirectory(drop.targetPath)
    await uploadTask.uploadFile(file, drop.targetPath)
  }

  onBeforeUnmount(clearDropTarget)

  return {
    activeDropPath,
    clearDropTarget,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}

export const useFileTreeDropTargetState = (
  path: MaybeRefOrGetter<string | null>,
): ComputedRef<boolean> => {
  const context = inject(fileTreeDropKey)
  if (!context) {
    throw new Error('File tree drop context is unavailable')
  }
  return computed(() => {
    const targetPath = toValue(path)
    return targetPath !== null && context.activeDropPath.value === normalizeNodePath(targetPath)
  })
}
