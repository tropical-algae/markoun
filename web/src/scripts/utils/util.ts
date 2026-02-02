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

export const getLocalTime = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliSeconds = String(now.getMilliseconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliSeconds}`;
}

export const insertTimeToFileName = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');

  const localtime = getLocalTime();
  if (lastDotIndex === -1) {
    return `${filename}-${localtime}`;
  }

  const baseName = filename.slice(0, lastDotIndex);
  const ext = filename.slice(lastDotIndex);
  return `${baseName}-${localtime}${ext}`;
}