import type { PoolClient } from 'pg'

// ── Types ──────────────────────────────────────────────────

export type NoteStatus = 'active' | 'archived' | 'deleted'

export interface Note {
  id: string
  workspaceId: string
  title: string
  content: unknown[] // Plate JSON (Slate Descendant[])
  status: NoteStatus
  tags: string[]
  color: string | null
  icon: string | null
  coverImage: string | null
  isPinned: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateNoteParams {
  workspaceId: string
  title: string
  content?: unknown[]
  tags?: string[]
  color?: string
  isPinned?: boolean
}

export interface UpdateNoteParams {
  title?: string
  content?: unknown[]
  status?: NoteStatus
  tags?: string[]
  color?: string | null
  icon?: string | null
  coverImage?: string | null
  isPinned?: boolean
}

// ── Helpers ────────────────────────────────────────────────

const NOTE_COLS = `
  id, workspace_id as "workspaceId",
  title, content, status, tags,
  color, icon, cover_image_url as "coverImage",
  is_pinned as "isPinned",
  created_by as "createdBy",
  created_at as "createdAt",
  updated_at as "updatedAt"`

function mapRow(row: Record<string, unknown>): Note {
  return {
    ...row,
    content: Array.isArray(row.content) ? row.content : [],
  } as Note
}

// ── CRUD ───────────────────────────────────────────────────

export async function createNote(
  client: PoolClient,
  params: CreateNoteParams
): Promise<Note> {
  const {
    workspaceId,
    title,
    content = [{ type: 'p', children: [{ text: '' }] }],
    tags = [],
    color,
    isPinned = false,
  } = params

  const result = await client.query(
    `insert into content.note
       (workspace_id, title, content, tags, color, is_pinned, created_by)
     values ($1, $2, $3::jsonb, $4, $5, $6, core.current_user_id())
     returning ${NOTE_COLS}`,
    [workspaceId, title, JSON.stringify(content), tags, color ?? null, isPinned]
  )

  return mapRow(result.rows[0])
}

export async function findNotesByWorkspace(
  client: PoolClient,
  workspaceId: string,
  options?: { limit?: number; status?: NoteStatus; search?: string }
): Promise<Note[]> {
  const conditions = ['workspace_id = $1']
  const values: unknown[] = [workspaceId]
  let idx = 2

  if (options?.status) {
    conditions.push(`status = $${idx}`)
    values.push(options.status)
    idx++
  } else {
    conditions.push(`status != 'deleted'`)
  }

  const isSearching = !!options?.search
  if (isSearching) {
    conditions.push(`search_vector @@ plainto_tsquery('english', $${idx})`)
    values.push(options!.search)
    idx++
  }

  const limit = options?.limit ?? 200
  values.push(limit)

  // When searching, rank by relevance; otherwise sort by pinned + updated
  const orderBy = isSearching
    ? `ts_rank(search_vector, plainto_tsquery('english', $${idx - 1})) desc, updated_at desc`
    : 'is_pinned desc, updated_at desc'

  const result = await client.query(
    `select ${NOTE_COLS}
     from content.note
     where ${conditions.join(' and ')}
     order by ${orderBy}
     limit $${idx}`,
    values
  )

  return result.rows.map(mapRow)
}

export async function findNoteById(
  client: PoolClient,
  id: string
): Promise<Note | null> {
  const result = await client.query(
    `select ${NOTE_COLS} from content.note where id = $1`,
    [id]
  )
  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function updateNote(
  client: PoolClient,
  id: string,
  params: UpdateNoteParams
): Promise<Note | null> {
  const sets: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (params.title !== undefined) {
    sets.push(`title = $${idx++}`)
    values.push(params.title)
  }
  if (params.content !== undefined) {
    sets.push(`content = $${idx++}::jsonb`)
    values.push(JSON.stringify(params.content))
  }
  if (params.status !== undefined) {
    sets.push(`status = $${idx++}`)
    values.push(params.status)
  }
  if (params.tags !== undefined) {
    sets.push(`tags = $${idx++}`)
    values.push(params.tags)
  }
  if (params.color !== undefined) {
    sets.push(`color = $${idx++}`)
    values.push(params.color)
  }
  if (params.icon !== undefined) {
    sets.push(`icon = $${idx++}`)
    values.push(params.icon)
  }
  if (params.coverImage !== undefined) {
    sets.push(`cover_image_url = $${idx++}`)
    values.push(params.coverImage)
  }
  if (params.isPinned !== undefined) {
    sets.push(`is_pinned = $${idx++}`)
    values.push(params.isPinned)
  }

  if (sets.length === 0) return findNoteById(client, id)

  values.push(id)

  const result = await client.query(
    `update content.note
     set ${sets.join(', ')}
     where id = $${idx}
     returning ${NOTE_COLS}`,
    values
  )

  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function deleteNote(
  client: PoolClient,
  id: string
): Promise<boolean> {
  const result = await client.query(
    `delete from content.note where id = $1`,
    [id]
  )
  return (result.rowCount ?? 0) > 0
}

export async function findPinnedNotes(
  client: PoolClient,
  workspaceId: string,
  limit = 10
): Promise<Pick<Note, 'id' | 'title' | 'icon'>[]> {
  const result = await client.query(
    `select id, title, icon
     from content.note
     where workspace_id = $1 and is_pinned = true and status = 'active'
     order by updated_at desc
     limit $2`,
    [workspaceId, limit]
  )
  return result.rows
}

export async function countNotesByWorkspace(
  client: PoolClient,
  workspaceId: string
): Promise<number> {
  const result = await client.query(
    `select count(*)::int as total
     from content.note
     where workspace_id = $1 and status != 'deleted'`,
    [workspaceId]
  )
  return result.rows[0]?.total ?? 0
}
