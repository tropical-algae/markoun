import type { FsNode } from "@/types/file-system";
import { getLocalTime } from "@/utils/datetime";

export const ROOT_DIRECTORY_PATH = '.';

export const normalizeNodePath = (path?: string | null): string => {
  if (!path || path === './' || path === '/') {
    return ROOT_DIRECTORY_PATH;
  }

  const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized === '' ? ROOT_DIRECTORY_PATH : normalized;
};

export const getParentPath = (node?: FsNode | string | null): string => {
  if (!node) return ROOT_DIRECTORY_PATH;

  if (typeof node !== 'string' && node.type === 'dir') {
    return normalizeNodePath(node.path);
  }

  const fullPath = normalizeNodePath(typeof node === 'string' ? node : node.path);
  const lastSlashIndex = fullPath.lastIndexOf('/');
  return lastSlashIndex > -1 ? fullPath.slice(0, lastSlashIndex) : ROOT_DIRECTORY_PATH;
};

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
  const normalizedRootPath = normalizeNodePath(rootPath);
  const fakeBase = 'http://n';
  const basePath = normalizedRootPath === ROOT_DIRECTORY_PATH ? '/' : `/${normalizedRootPath}/`;
  const fullUrl = new URL(relativeFilePath, fakeBase + basePath);
  return ('/media' + fullUrl.pathname).replace(/\/+/g, '/');
}

export const joinRelativePath = (parentPath: string, childName: string): string => {
  const normalizedParentPath = normalizeNodePath(parentPath);
  return normalizedParentPath === ROOT_DIRECTORY_PATH
    ? childName
    : `${normalizedParentPath}/${childName}`;
};

export const isPathInside = (path: string, prefix: string): boolean => {
  const normalizedPath = normalizeNodePath(path);
  const normalizedPrefix = normalizeNodePath(prefix);

  if (normalizedPath === normalizedPrefix) {
    return true;
  }

  if (normalizedPrefix === ROOT_DIRECTORY_PATH) {
    return false;
  }

  return normalizedPath.startsWith(`${normalizedPrefix}/`);
};

export const replacePathPrefix = (
  path: string,
  oldPrefix: string,
  newPrefix: string
): string => {
  const normalizedPath = normalizeNodePath(path);
  const normalizedOldPrefix = normalizeNodePath(oldPrefix);
  const normalizedNewPrefix = normalizeNodePath(newPrefix);

  if (normalizedPath === normalizedOldPrefix) {
    return normalizedNewPrefix;
  }

  if (!isPathInside(normalizedPath, normalizedOldPrefix)) {
    return normalizedPath;
  }

  const restPath = normalizedPath.slice(normalizedOldPrefix.length + 1);
  return normalizedNewPrefix === ROOT_DIRECTORY_PATH
    ? restPath
    : `${normalizedNewPrefix}/${restPath}`;
};
