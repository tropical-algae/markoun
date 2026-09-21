export type HistoryAvailability = 'unknown' | 'enabled' | 'disabled'

export interface HistoryNode {
  id: string
  parent_id: string | null
  created_at: string
  sequence: number
  content_size: number
  author: string | null
  path: string
  message: string | null
}

export interface HistoryTree {
  note_id: string
  root_node_id: string | null
  default_revision_id: string | null
  nodes: HistoryNode[]
}

export interface HistoryRevision {
  revision_id: string
  content: string
}
