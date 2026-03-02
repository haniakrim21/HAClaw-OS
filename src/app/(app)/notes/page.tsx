import { getSession } from '@/lib/auth/session'
import { getActiveWorkspace } from '@/lib/workspace'
import { withUser } from '@/lib/db'
import { findNotesByWorkspace } from '@/lib/db/repositories/note.repository'
import { redirect } from 'next/navigation'
import { NotesList } from './NotesList'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const [session, workspace] = await Promise.all([
    getSession(),
    getActiveWorkspace(),
  ])

  if (!session.userId) redirect('/login')

  if (!workspace) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--muted)]">Select a workspace to view notes</div>
      </div>
    )
  }

  const notes = await withUser(session.userId, (client) =>
    findNotesByWorkspace(client, workspace.id, { limit: 200 })
  )

  return <NotesList initialNotes={notes} />
}
