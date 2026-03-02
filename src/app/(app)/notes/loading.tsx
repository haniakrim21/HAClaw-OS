function NoteCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
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

export default function NotesLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-20 rounded-lg bg-[var(--hover)]" />
        <div className="h-9 w-28 rounded-lg bg-[var(--hover)]" />
      </div>

      {/* Search */}
      <div className="h-10 w-full rounded-lg bg-[var(--hover)]" />

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        <div className="h-4 w-14 rounded bg-[var(--hover)] mb-2" />
        <div className="h-4 w-16 rounded bg-[var(--hover)] mb-2 ml-4" />
        <div className="h-4 w-18 rounded bg-[var(--hover)] mb-2 ml-4" />
      </div>

      {/* Grid — matches NotesList grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
