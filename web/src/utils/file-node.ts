import type { FileDetail, FsNode } from '@/types/file-system'
import { getParentPath, joinRelativePath, normalizeNodePath } from '@/utils/file-system'

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
