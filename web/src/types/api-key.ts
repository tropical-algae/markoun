export const McpPermission = {
  Read: 'read',
  Search: 'search',
  Write: 'write',
  Create: 'create',
  Move: 'move',
  Delete: 'delete',
} as const

export type McpPermission = typeof McpPermission[keyof typeof McpPermission]

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  permissions: McpPermission[]
  is_active: boolean
  created_at: string | null
  last_used_at: string | null
}

export interface ApiKeyCreated extends ApiKeyInfo {
  key: string
}

export interface ApiKeyCreateRequest {
  name: string
  permissions: McpPermission[]
}
