'use server'

import { getSession } from '@/lib/auth/session'
import { getActiveWorkspace } from '@/lib/workspace'
import { withUser } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { validateAction } from '@/lib/validation'
import { createNoteSchema, updateNoteSchema, noteIdSchema } from '@/lib/validation-schemas'
import {
  createNote as createNoteRepo,
  updateNote as updateNoteRepo,
  deleteNote as deleteNoteRepo,
  findNotesByWorkspace,
  findPinnedNotes as findPinnedNotesRepo,
  type Note,
} from '@/lib/db/repositories/note.repository'
import { bumpRevision } from '@/lib/revision-store'

const log = createLogger('note-actions')

export async function createNoteAction(
  params: { title: string; content?: unknown[]; tags?: string[]; color?: string; isPinned?: boolean }
): Promise<{ note?: Note; error?: string }> {
  const session = await getSession()
  if (!session.userId) return { error: 'Unauthorized' }

  const v = validateAction(createNoteSchema, params)
  if (v.error) return { error: v.error }

  const workspace = await getActiveWorkspace()
  if (!workspace) return { error: 'No workspace selected' }

  try {
    const note = await withUser(session.userId, (client) =>
      createNoteRepo(client, { ...params, workspaceId: workspace.id })
    )
    bumpRevision('notes')
    return { note }
  } catch (error) {
    log.error('Create note failed', { error: error instanceof Error ? error.message : String(error) })
    return { error: 'Failed to create note' }
  }
}

export async function updateNoteAction(
  noteId: string,
  params: { title?: string; content?: unknown[]; status?: 'active' | 'archived' | 'deleted'; tags?: string[]; color?: string | null; icon?: string | null; coverImage?: string | null; isPinned?: boolean }
): Promise<{ note?: Note; error?: string }> {
  const session = await getSession()
  if (!session.userId) return { error: 'Unauthorized' }

  const idV = validateAction(noteIdSchema, noteId)
  if (idV.error) return { error: 'Invalid note ID' }
  const v = validateAction(updateNoteSchema, params)
  if (v.error) return { error: v.error }

  try {
    const note = await withUser(session.userId, (client) =>
      updateNoteRepo(client, noteId, params)
    )
    if (!note) return { error: 'Note not found' }
    bumpRevision('notes')
    return { note }
  } catch (error) {
    log.error('Update note failed', { error: error instanceof Error ? error.message : String(error) })
    return { error: 'Failed to update note' }
  }
}

export async function deleteNoteAction(
  noteId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession()
  if (!session.userId) return { error: 'Unauthorized' }

  const idV = validateAction(noteIdSchema, noteId)
  if (idV.error) return { error: 'Invalid note ID' }

  try {
    const ok = await withUser(session.userId, (client) =>
      deleteNoteRepo(client, noteId)
    )
    if (!ok) return { error: 'Note not found' }
    bumpRevision('notes')
    return { success: true }
  } catch (error) {
    log.error('Delete note failed', { error: error instanceof Error ? error.message : String(error) })
    return { error: 'Failed to delete note' }
  }
}

export async function getPinnedNotesAction(): Promise<{ notes?: Pick<Note, 'id' | 'title' | 'icon'>[]; error?: string }> {
  const session = await getSession()
  if (!session.userId) return { error: 'Unauthorized' }

  const workspace = await getActiveWorkspace()
  if (!workspace) return { error: 'No workspace' }

  try {
    const notes = await withUser(session.userId, (client) =>
      findPinnedNotesRepo(client, workspace.id)
    )
    return { notes }
  } catch (error) {
    log.error('Get pinned notes failed', { error: error instanceof Error ? error.message : String(error) })
    return { error: 'Failed to load pinned notes' }
  }
}

export async function refreshNotesAction(): Promise<{ notes?: Note[]; error?: string }> {
  const session = await getSession()
  if (!session.userId) return { error: 'Unauthorized' }

  const workspace = await getActiveWorkspace()
  if (!workspace) return { error: 'No workspace selected' }

  try {
    const notes = await withUser(session.userId, (client) =>
      findNotesByWorkspace(client, workspace.id, { limit: 200 })
    )
    return { notes }
  } catch (error) {
    log.error('Refresh notes failed', { error: error instanceof Error ? error.message : String(error) })
    return { error: 'Failed to load notes' }
  }
}
