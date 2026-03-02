import { describe, it, expect, vi } from 'vitest'
import type { PoolClient, QueryResult } from 'pg'
import {
  createNote,
  findNotesByWorkspace,
  findNoteById,
  updateNote,
  deleteNote,
  countNotesByWorkspace,
} from '../note.repository'

// Mock PoolClient
function createMockClient(rows: Record<string, unknown>[] = [], rowCount = 1): PoolClient {
  return {
    query: vi.fn().mockResolvedValue({ rows, rowCount } as QueryResult),
  } as unknown as PoolClient
}

const SAMPLE_NOTE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  workspaceId: 'ws-123',
  title: 'Test Note',
  content: [{ type: 'p', children: [{ text: 'Hello world' }] }],
  status: 'active',
  tags: ['test'],
  color: null,
  isPinned: false,
  createdBy: 'user-1',
  createdAt: '2026-02-28T00:00:00Z',
  updatedAt: '2026-02-28T00:00:00Z',
}

describe('note.repository', () => {
  describe('createNote', () => {
    it('inserts note with all params', async () => {
      const client = createMockClient([SAMPLE_NOTE])

      const result = await createNote(client, {
        workspaceId: 'ws-123',
        title: 'Test Note',
        content: [{ type: 'p', children: [{ text: 'Hello world' }] }],
        tags: ['test'],
        isPinned: false,
      })

      expect(result.id).toBe(SAMPLE_NOTE.id)
      expect(result.title).toBe('Test Note')
      expect(client.query).toHaveBeenCalledOnce()

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('insert into content.note')
      expect(params[0]).toBe('ws-123')
      expect(params[1]).toBe('Test Note')
      expect(params[2]).toBe(JSON.stringify([{ type: 'p', children: [{ text: 'Hello world' }] }]))
      expect(params[3]).toEqual(['test'])
      expect(params[5]).toBe(false)
    })

    it('uses default empty content when not provided', async () => {
      const client = createMockClient([SAMPLE_NOTE])

      await createNote(client, {
        workspaceId: 'ws-123',
        title: 'Minimal',
      })

      const params = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][1]
      // Default content: [{ type: 'p', children: [{ text: '' }] }]
      expect(JSON.parse(params[2] as string)).toEqual([{ type: 'p', children: [{ text: '' }] }])
      expect(params[3]).toEqual([]) // default tags
      expect(params[4]).toBeNull() // color null
      expect(params[5]).toBe(false) // default isPinned
    })

    it('maps content array correctly', async () => {
      const rawNote = { ...SAMPLE_NOTE, content: 'not an array' }
      const client = createMockClient([rawNote])

      const result = await createNote(client, {
        workspaceId: 'ws-123',
        title: 'Test',
      })

      // mapRow should return empty array for non-array content
      expect(result.content).toEqual([])
    })
  })

  describe('findNotesByWorkspace', () => {
    it('fetches notes for workspace', async () => {
      const client = createMockClient([SAMPLE_NOTE])

      const result = await findNotesByWorkspace(client, 'ws-123')

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Note')
      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('workspace_id = $1')
      expect(params[0]).toBe('ws-123')
    })

    it('excludes deleted notes by default', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123')

      const sql = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(sql).toContain("status != 'deleted'")
    })

    it('applies status filter', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123', { status: 'archived' })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('status = $2')
      expect(params).toContain('archived')
    })

    it('applies search filter on title and content', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123', { search: 'hello' })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('ilike')
      expect(params).toContain('%hello%')
    })

    it('defaults to limit 200', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123')

      const sql = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      const params = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][1] as unknown[]
      expect(sql).toMatch(/limit \$\d+/)
      expect(params).toContain(200)
    })

    it('respects custom limit', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123', { limit: 50 })

      const sql = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      const params = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][1] as unknown[]
      expect(sql).toMatch(/limit \$\d+/)
      expect(params).toContain(50)
    })

    it('orders by pinned then updated_at desc', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123')

      const sql = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(sql).toContain('is_pinned desc')
      expect(sql).toContain('updated_at desc')
    })

    it('applies both status and search filters together', async () => {
      const client = createMockClient([])

      await findNotesByWorkspace(client, 'ws-123', { status: 'active', search: 'test' })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('status = $2')
      expect(sql).toContain('ilike $3')
      expect(params[1]).toBe('active')
      expect(params[2]).toBe('%test%')
    })
  })

  describe('findNoteById', () => {
    it('returns note when found', async () => {
      const client = createMockClient([SAMPLE_NOTE])

      const result = await findNoteById(client, SAMPLE_NOTE.id)

      expect(result).not.toBeNull()
      expect(result!.id).toBe(SAMPLE_NOTE.id)
    })

    it('returns null when not found', async () => {
      const client = createMockClient([])

      const result = await findNoteById(client, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateNote', () => {
    it('builds dynamic SET for title', async () => {
      const client = createMockClient([{ ...SAMPLE_NOTE, title: 'Updated' }])

      await updateNote(client, SAMPLE_NOTE.id, { title: 'Updated' })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('update content.note')
      expect(sql).toContain('title = $1')
      expect(params[0]).toBe('Updated')
      expect(params[1]).toBe(SAMPLE_NOTE.id)
    })

    it('builds dynamic SET for content as JSONB', async () => {
      const newContent = [{ type: 'p', children: [{ text: 'Updated content' }] }]
      const client = createMockClient([{ ...SAMPLE_NOTE, content: newContent }])

      await updateNote(client, SAMPLE_NOTE.id, { content: newContent })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('content = $1::jsonb')
      expect(params[0]).toBe(JSON.stringify(newContent))
    })

    it('builds dynamic SET for multiple fields', async () => {
      const client = createMockClient([{ ...SAMPLE_NOTE, title: 'New', isPinned: true }])

      await updateNote(client, SAMPLE_NOTE.id, {
        title: 'New',
        isPinned: true,
        status: 'archived',
        tags: ['a', 'b'],
      })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('title = $1')
      expect(sql).toContain('status = $2')
      expect(sql).toContain('tags = $3')
      expect(sql).toContain('is_pinned = $4')
      expect(params[0]).toBe('New')
      expect(params[1]).toBe('archived')
      expect(params[2]).toEqual(['a', 'b'])
      expect(params[3]).toBe(true)
      expect(params[4]).toBe(SAMPLE_NOTE.id)
    })

    it('returns existing note when no fields provided', async () => {
      const client = createMockClient([SAMPLE_NOTE])

      const result = await updateNote(client, SAMPLE_NOTE.id, {})

      expect(result).not.toBeNull()
      // Should call findNoteById (SELECT) instead of UPDATE
      const sql = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(sql).toContain('select')
      expect(sql).not.toContain('update content.note')
    })

    it('returns null when note not found for update', async () => {
      const client = createMockClient([])

      const result = await updateNote(client, 'non-existent', { title: 'Test' })

      expect(result).toBeNull()
    })

    it('handles color set to null', async () => {
      const client = createMockClient([{ ...SAMPLE_NOTE, color: null }])

      await updateNote(client, SAMPLE_NOTE.id, { color: null })

      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain('color = $1')
      expect(params[0]).toBeNull()
    })
  })

  describe('deleteNote', () => {
    it('returns true when deleted', async () => {
      const client = createMockClient([], 1)

      const result = await deleteNote(client, SAMPLE_NOTE.id)

      expect(result).toBe(true)
      const sql = (client.query as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(sql).toContain('delete from content.note')
    })

    it('returns false when not found', async () => {
      const client = createMockClient([], 0)

      const result = await deleteNote(client, 'non-existent')

      expect(result).toBe(false)
    })
  })

  describe('countNotesByWorkspace', () => {
    it('returns count excluding deleted', async () => {
      const client = createMockClient([{ total: 5 }])

      const result = await countNotesByWorkspace(client, 'ws-123')

      expect(result).toBe(5)
      const [sql, params] = (client.query as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(sql).toContain("status != 'deleted'")
      expect(params[0]).toBe('ws-123')
    })

    it('returns 0 when no notes', async () => {
      const client = createMockClient([{}])

      const result = await countNotesByWorkspace(client, 'ws-123')

      expect(result).toBe(0)
    })
  })
})
