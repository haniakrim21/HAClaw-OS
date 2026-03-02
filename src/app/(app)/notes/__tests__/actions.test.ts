import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn().mockResolvedValue({ userId: 'user-1' }),
}))

vi.mock('@/lib/workspace', () => ({
  getActiveWorkspace: vi.fn().mockResolvedValue({ id: 'ws-1', name: 'Test' }),
}))

const mockWithUser = vi.fn()
vi.mock('@/lib/db', () => ({
  withUser: (...args: unknown[]) => mockWithUser(...args),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/lib/revision-store', () => ({
  bumpRevision: vi.fn(),
}))

const mockCreateNote = vi.fn()
const mockUpdateNote = vi.fn()
const mockDeleteNote = vi.fn()
const mockFindNotesByWorkspace = vi.fn()

vi.mock('@/lib/db/repositories/note.repository', () => ({
  createNote: (...args: unknown[]) => mockCreateNote(...args),
  updateNote: (...args: unknown[]) => mockUpdateNote(...args),
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
  findNotesByWorkspace: (...args: unknown[]) => mockFindNotesByWorkspace(...args),
}))

import { createNoteAction, updateNoteAction, deleteNoteAction, refreshNotesAction } from '../actions'
import { getSession } from '@/lib/auth/session'
import { getActiveWorkspace } from '@/lib/workspace'

const SAMPLE_NOTE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  workspaceId: 'ws-1',
  title: 'Test Note',
  content: [{ type: 'p', children: [{ text: '' }] }],
  status: 'active' as const,
  tags: [],
  color: null,
  isPinned: false,
  createdBy: 'user-1',
  createdAt: '2026-02-28T00:00:00Z',
  updatedAt: '2026-02-28T00:00:00Z',
}

describe('note actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWithUser.mockImplementation(async (_userId: string, fn: (client: unknown) => Promise<unknown>) => fn({}))
  })

  // ── createNoteAction ─────────────────────────────────────

  describe('createNoteAction', () => {
    it('returns error when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: undefined } as unknown as Awaited<ReturnType<typeof getSession>>)

      const result = await createNoteAction({ title: 'Test' })
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when no workspace', async () => {
      vi.mocked(getActiveWorkspace).mockResolvedValueOnce(null)

      const result = await createNoteAction({ title: 'Test' })
      expect(result.error).toBe('No workspace selected')
    })

    it('allows empty title (Notion-style untitled)', async () => {
      mockCreateNote.mockResolvedValue({ ...SAMPLE_NOTE, title: '' })
      const result = await createNoteAction({ title: '' })
      expect(result.note).toBeDefined()
    })

    it('returns error for title too long', async () => {
      const result = await createNoteAction({ title: 'x'.repeat(201) })
      expect(result.error).toBeDefined()
    })

    it('creates note successfully', async () => {
      mockCreateNote.mockResolvedValue(SAMPLE_NOTE)

      const result = await createNoteAction({ title: 'Test Note' })
      expect(result.note).toBeDefined()
      expect(result.note!.id).toBe(SAMPLE_NOTE.id)
      expect(result.error).toBeUndefined()
    })

    it('creates note with tags and content', async () => {
      mockCreateNote.mockResolvedValue({ ...SAMPLE_NOTE, tags: ['tag1'], content: [{ type: 'p', children: [{ text: 'Hello' }] }] })

      const result = await createNoteAction({
        title: 'Test Note',
        content: [{ type: 'p', children: [{ text: 'Hello' }] }],
        tags: ['tag1'],
      })
      expect(result.note).toBeDefined()
      expect(result.note!.tags).toEqual(['tag1'])
    })

    it('returns error when DB throws', async () => {
      mockCreateNote.mockRejectedValue(new Error('DB connection failed'))

      const result = await createNoteAction({ title: 'Test' })
      expect(result.error).toBe('Failed to create note')
    })
  })

  // ── updateNoteAction ─────────────────────────────────────

  describe('updateNoteAction', () => {
    it('returns error when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: undefined } as unknown as Awaited<ReturnType<typeof getSession>>)

      const result = await updateNoteAction(SAMPLE_NOTE.id, { title: 'Updated' })
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error for invalid note ID', async () => {
      const result = await updateNoteAction('not-a-uuid', { title: 'Updated' })
      expect(result.error).toBe('Invalid note ID')
    })

    it('updates title successfully', async () => {
      mockUpdateNote.mockResolvedValue({ ...SAMPLE_NOTE, title: 'Updated' })

      const result = await updateNoteAction(SAMPLE_NOTE.id, { title: 'Updated' })
      expect(result.note).toBeDefined()
      expect(result.note!.title).toBe('Updated')
    })

    it('updates status to archived', async () => {
      mockUpdateNote.mockResolvedValue({ ...SAMPLE_NOTE, status: 'archived' })

      const result = await updateNoteAction(SAMPLE_NOTE.id, { status: 'archived' })
      expect(result.note!.status).toBe('archived')
    })

    it('updates isPinned', async () => {
      mockUpdateNote.mockResolvedValue({ ...SAMPLE_NOTE, isPinned: true })

      const result = await updateNoteAction(SAMPLE_NOTE.id, { isPinned: true })
      expect(result.note!.isPinned).toBe(true)
    })

    it('returns error when note not found', async () => {
      mockUpdateNote.mockResolvedValue(null)

      const result = await updateNoteAction(SAMPLE_NOTE.id, { title: 'Updated' })
      expect(result.error).toBe('Note not found')
    })

    it('returns error when DB throws', async () => {
      mockUpdateNote.mockRejectedValue(new Error('DB error'))

      const result = await updateNoteAction(SAMPLE_NOTE.id, { title: 'Updated' })
      expect(result.error).toBe('Failed to update note')
    })
  })

  // ── deleteNoteAction ─────────────────────────────────────

  describe('deleteNoteAction', () => {
    it('returns error when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: undefined } as unknown as Awaited<ReturnType<typeof getSession>>)

      const result = await deleteNoteAction(SAMPLE_NOTE.id)
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error for invalid note ID', async () => {
      const result = await deleteNoteAction('not-a-uuid')
      expect(result.error).toBe('Invalid note ID')
    })

    it('deletes successfully', async () => {
      mockDeleteNote.mockResolvedValue(true)

      const result = await deleteNoteAction(SAMPLE_NOTE.id)
      expect(result.success).toBe(true)
    })

    it('returns error when note not found', async () => {
      mockDeleteNote.mockResolvedValue(false)

      const result = await deleteNoteAction(SAMPLE_NOTE.id)
      expect(result.error).toBe('Note not found')
    })

    it('returns error when DB throws', async () => {
      mockDeleteNote.mockRejectedValue(new Error('DB error'))

      const result = await deleteNoteAction(SAMPLE_NOTE.id)
      expect(result.error).toBe('Failed to delete note')
    })
  })

  // ── refreshNotesAction ───────────────────────────────────

  describe('refreshNotesAction', () => {
    it('returns error when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: undefined } as unknown as Awaited<ReturnType<typeof getSession>>)

      const result = await refreshNotesAction()
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when no workspace', async () => {
      vi.mocked(getActiveWorkspace).mockResolvedValueOnce(null)

      const result = await refreshNotesAction()
      expect(result.error).toBe('No workspace selected')
    })

    it('returns notes list', async () => {
      mockFindNotesByWorkspace.mockResolvedValue([SAMPLE_NOTE])

      const result = await refreshNotesAction()
      expect(result.notes).toHaveLength(1)
      expect(result.notes![0].title).toBe('Test Note')
    })

    it('returns error when DB throws', async () => {
      mockFindNotesByWorkspace.mockRejectedValue(new Error('DB error'))

      const result = await refreshNotesAction()
      expect(result.error).toBe('Failed to load notes')
    })
  })
})
