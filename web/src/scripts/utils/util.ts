import type { FsNode } from "@/scripts/types";

export const getTargetDirPath = (node?: FsNode | null): string => {
  if (!node) return './';
  // dir取dir路径
  if (node.type === 'dir') {
    return node.path;
  }
  // file取父目录
  const lastSlashIndex = node.path.lastIndexOf('/');
  return lastSlashIndex > -1 ? node.path.slice(0, lastSlashIndex) : '';
}
