import type { FileDetail, FsNode } from '@/types/file-system'
import {
  getParentPath,
  joinRelativePath,
  normalizeNodePath,
  replacePathPrefix,
} from '@/utils/file-system'

const PREVIEWABLE_IMAGE_SUFFIXES = new Set(['png', 'jpg', 'jpeg', 'bmp', 'svg'])

export const normalizeFsNode = (node: FsNode): FsNode => ({
  ...node,
  path: normalizeNodePath(node.path),
})

export const isMarkdownNode = (node: FsNode): boolean => {
  return node.type === 'file' && node.suffix.toLowerCase() === 'md'
}

export const isPreviewableImageNode = (node: FsNode): boolean => {
  return node.type === 'file' && PREVIEWABLE_IMAGE_SUFFIXES.has(node.suffix.toLowerCase())
}

export const sortFsNodes = (nodes: FsNode[]): FsNode[] => {
  return [...nodes].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'dir' ? -1 : 1
    }

    const leftIsMarkdown = left.suffix.toLowerCase() === 'md'
    const rightIsMarkdown = right.suffix.toLowerCase() === 'md'
    if (leftIsMarkdown !== rightIsMarkdown) {
      return leftIsMarkdown ? -1 : 1
    }

    const suffixResult = left.suffix.localeCompare(right.suffix)
    if (suffixResult !== 0) {
      return suffixResult
    }

    return left.name.localeCompare(right.name)
  })
}

export const buildFileDetailShell = (node: FsNode): FileDetail => ({
  name: node.name,
  path: node.path,
  suffix: node.suffix,
  content: '',
  meta: {},
})

export const buildRenamedPath = (node: FsNode, newName: string): string => {
  const parentPath = getParentPath(node.path)
  const nextName = node.type === 'file' && node.suffix ? `${newName}.${node.suffix}` : newName
  return joinRelativePath(parentPath, nextName)
}

export const remapFsNodePathPrefix = (
  node: FsNode,
  oldPath: string,
  newPath: string,
  exactName: string,
): FsNode => {
  const nextPath = replacePathPrefix(node.path, oldPath, newPath)
  if (nextPath === node.path) {
    return node
  }

  return {
    ...node,
    path: nextPath,
    name: node.path === oldPath ? exactName : node.name,
  }
}

export const remapOptionalFsNodePathPrefix = (
  node: FsNode | null,
  oldPath: string,
  newPath: string,
  exactName: string,
): FsNode | null => {
  return node ? remapFsNodePathPrefix(node, oldPath, newPath, exactName) : null
}

export const remapFileDetailPathPrefix = (
  file: FileDetail,
  oldPath: string,
  newPath: string,
  exactName: string,
): FileDetail => {
  const nextPath = replacePathPrefix(file.path, oldPath, newPath)
  if (nextPath === file.path) {
    return file
  }

  return {
    ...file,
    path: nextPath,
    name: file.path === oldPath ? exactName : file.name,
    meta: {
      ...file.meta,
      path: replacePathPrefix(file.meta.path || '', oldPath, newPath),
    },
  }
}
