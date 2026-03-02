'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import type { Note } from '@/lib/db/repositories/note.repository'
import { createNoteAction, updateNoteAction, deleteNoteAction } from './actions'
import { NoteCard } from './NoteCard'
import { NoteDetailView } from './NoteDetailView'
import { SwipeableNoteCard } from './SwipeableNoteCard'
import { createClientLogger } from '@/lib/client-logger'

const log = createClientLogger('notes')

type Filter = 'all' | 'pinned' | 'archived'

function NoteCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse">
      <div className="flex-1 p-4 space-y-2.5">
        <div className="h-[18px] w-3/5 rounded bg-[var(--hover)]" />
        <div className="h-3 w-full rounded bg-[var(--hover)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--hover)]" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-3 w-12 rounded bg-[var(--hover)]" />
          <div className="h-4 w-14 rounded bg-[var(--hover)]" />
        </div>
      </div>
    </div>
  )
}

export function NotesList({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const filtered = notes.filter((n) => {
    if (filter === 'pinned' && !n.isPinned) return false
    if (filter === 'archived' && n.status !== 'archived') return false
    if (filter === 'all' && n.status === 'archived') return false
    if (search) {
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
    }
    return true
  })

  const handleCreate = useCallback(() => {
    startTransition(async () => {
      const result = await createNoteAction({ title: '' })
      if (result.note) {
        setNotes((prev) => [result.note!, ...prev])
        setSelectedId(result.note.id)
      } else {
        log.error('Create failed', { error: result.error })
      }
    })
  }, [])

  const handleUpdate = useCallback((updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId(null)
  }, [])

  const handleTogglePin = useCallback((note: Note) => {
    startTransition(async () => {
      const result = await updateNoteAction(note.id, { isPinned: !note.isPinned })
      if (result.note) handleUpdate(result.note)
    })
  }, [handleUpdate])

  const handleArchive = useCallback((note: Note) => {
    startTransition(async () => {
      const result = await updateNoteAction(note.id, { status: note.status === 'archived' ? 'active' : 'archived' })
      if (result.note) handleUpdate(result.note)
    })
  }, [handleUpdate])

  const handleCardDelete = useCallback((id: string) => {
    if (!confirm('Delete this note?')) return
    startTransition(async () => {
      const result = await deleteNoteAction(id)
      if (result.success) handleDelete(id)
    })
  }, [handleDelete])

  // ── Detail view ───────────────────────────────────────

  const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) : null

  if (selectedNote) {
    return (
      <NoteDetailView
        note={selectedNote}
        onBack={() => setSelectedId(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    )
  }

  // ── List view ─────────────────────────────────────────

  const activeCount = notes.filter((n) => n.status !== 'archived').length
  const pinnedCount = notes.filter((n) => n.isPinned && n.status !== 'archived').length
  const archivedCount = notes.filter((n) => n.status === 'archived').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--fg)]">Notes</h1>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--neon)] text-[var(--bg)] text-sm font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {isPending ? 'Creating...' : 'New Note'}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes..."
        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
      />

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {([
          ['all', `All (${activeCount})`],
          ['pinned', `Pinned (${pinnedCount})`],
          ['archived', `Archive (${archivedCount})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 -mb-px border-b-2 text-sm transition-colors ${
              filter === key
                ? 'border-[var(--neon)] text-[var(--neon)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {!hydrated ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(filtered.length || 6, 6) }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          {search ? 'No notes match your search' : filter === 'archived' ? 'No archived notes' : 'No notes yet — create one!'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <SwipeableNoteCard
              key={note.id}
              onSwipeRight={() => handleTogglePin(note)}
              onSwipeLeft={() => handleArchive(note)}
              rightLabel={note.isPinned ? 'Unpin' : 'Pin'}
              leftLabel={note.status === 'archived' ? 'Restore' : 'Archive'}
            >
              <NoteCard
                note={note}
                onEdit={() => setSelectedId(note.id)}
                onPin={() => handleTogglePin(note)}
                onArchive={() => handleArchive(note)}
                onDelete={() => handleCardDelete(note.id)}
              />
            </SwipeableNoteCard>
          ))}
        </div>
      )}
    </div>
  )
}
