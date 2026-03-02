'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getPinnedNotesAction } from '@/app/(app)/notes/actions'

interface PinnedNote {
  id: string
  title: string
  icon: string | null
}

export function SidebarFavorites({ expanded }: { expanded: boolean }) {
  const [notes, setNotes] = useState<PinnedNote[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      const result = await getPinnedNotesAction()
      if (mounted && result.notes) setNotes(result.notes)
    }

    load()
    // Refresh every 30s
    const interval = setInterval(load, 30_000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (notes.length === 0) return null

  return (
    <div className="w-full mt-2">
      {expanded && (
        <div className="px-3 mb-1 flex items-center min-h-5">
          <span className="text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--muted-2)] whitespace-nowrap">
            Favorites
          </span>
        </div>
      )}

      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/notes?id=${note.id}`}
          className={`relative flex items-center rounded-xl transition-colors whitespace-nowrap text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--card)] ${
            expanded ? 'h-8 px-3 gap-2.5 justify-start' : 'h-8 w-10 mx-auto justify-center'
          }`}
          title={note.title || 'Untitled'}
        >
          <span className="shrink-0 text-sm leading-none">
            {note.icon || '📄'}
          </span>
          {expanded && (
            <span className="text-[12px] truncate max-w-[140px]">
              {note.title || 'Untitled'}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
