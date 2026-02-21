import type { FsNode } from "@/scripts/types";

export const getParentPath = (node?: FsNode | string | null): string => {
  if (!node) return './';
  if (typeof node !== 'string' && node.type === 'dir') {
    return node.path;
  }

  const fullPath = typeof node === 'string' ? node : node.path;
  const lastSlashIndex = fullPath.lastIndexOf('/');
  return lastSlashIndex > -1 ? fullPath.slice(0, lastSlashIndex) : './';
};

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

export const getMediaPath = (rootPath: string, relativeFilePath: string): string => {
  // abs path
  if (relativeFilePath.startsWith('/')) {
    return ('/media' + relativeFilePath).replace(/\/+/g, '/');
  }
  // relative path
  const fakeBase = 'http://n';
  const fullUrl = new URL(relativeFilePath, fakeBase + (rootPath.startsWith('/') ? '' : '/') + rootPath + '/');
  return ('/media' + fullUrl.pathname).replace(/\/+/g, '/');
}