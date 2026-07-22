export const resolveApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path
}
