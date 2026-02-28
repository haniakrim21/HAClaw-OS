'use client'

import { useState, useTransition } from 'react'
import type { Process } from '@/lib/db/repositories/process.repository'

interface ProcessFormProps {
  process?: Process | null
  onSubmit: (data: ProcessFormData) => Promise<void>
  onCancel: () => void
}

export interface ProcessFormData {
  title: string
  description?: string
  schedule: string
  actionType: string
  actionConfig?: Record<string, unknown>
}

const SCHEDULE_PRESETS = [
  { label: 'Every morning (9:00)', cron: '0 9 * * *' },
  { label: 'Every evening (20:00)', cron: '0 20 * * *' },
  { label: 'Weekdays at 9:00', cron: '0 9 * * 1-5' },
  { label: 'Every Monday (10:00)', cron: '0 10 * * 1' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Custom...', cron: '' },
] as const

const ACTION_TYPES = [
  { value: 'send_digest', label: 'Send Digest' },
  { value: 'send_reminder', label: 'Send Reminder' },
  { value: 'run_backup', label: 'Run Backup' },
] as const

export function ProcessForm({ process, onSubmit, onCancel }: ProcessFormProps) {
  const [title, setTitle] = useState(process?.title || '')
  const [description, setDescription] = useState(process?.description || '')
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (!process?.schedule) return 0
    const idx = SCHEDULE_PRESETS.findIndex((p) => p.cron === process.schedule)
    return idx >= 0 ? idx : SCHEDULE_PRESETS.length - 1
  })
  const [customCron, setCustomCron] = useState(process?.schedule || '')
  const [actionType, setActionType] = useState(process?.actionType || 'send_digest')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentCron = SCHEDULE_PRESETS[selectedPreset].cron || customCron

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Title is required'); return }
    if (!currentCron.trim()) { setError('Schedule is required'); return }

    startTransition(async () => {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        schedule: currentCron.trim(),
        actionType,
      })
      if (!process) {
        setTitle('')
        setDescription('')
        setSelectedPreset(0)
        setCustomCron('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md text-sm bg-[rgba(251,113,133,0.1)] text-[var(--red)]">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="proc-title" className="block text-sm mb-1.5 text-[var(--muted)]">
          Title
        </label>
        <input
          id="proc-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning news digest"
          className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-sm text-[var(--fg)]"
          required
        />
      </div>

      <div>
        <label htmlFor="proc-desc" className="block text-sm mb-1.5 text-[var(--muted)]">
          Description
        </label>
        <input
          id="proc-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-sm text-[var(--fg)]"
        />
      </div>

      <div>
        <label className="block text-sm mb-1.5 text-[var(--muted)]">Schedule</label>
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setSelectedPreset(i)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                borderColor: selectedPreset === i ? 'var(--neon)' : 'var(--border)',
                color: selectedPreset === i ? 'var(--neon)' : 'var(--muted)',
                background: selectedPreset === i ? 'var(--neon-dim)' : 'transparent',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {selectedPreset === SCHEDULE_PRESETS.length - 1 && (
          <input
            type="text"
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            placeholder="0 9 * * *"
            className="mt-2 w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-sm font-mono text-[var(--fg)]"
          />
        )}
      </div>

      <div>
        <label className="block text-sm mb-1.5 text-[var(--muted)]">Action</label>
        <div className="flex flex-wrap gap-2">
          {ACTION_TYPES.map((at) => (
            <button
              key={at.value}
              type="button"
              onClick={() => setActionType(at.value)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{
                borderColor: actionType === at.value ? 'var(--neon)' : 'var(--border)',
                color: actionType === at.value ? 'var(--neon)' : 'var(--muted)',
                background: actionType === at.value ? 'var(--neon-dim)' : 'transparent',
              }}
            >
              {at.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium transition-opacity"
          style={{ background: 'var(--neon)', color: 'var(--bg)', opacity: isPending ? 0.6 : 1 }}
        >
          {isPending ? 'Saving...' : process ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--fg)] hover:bg-[var(--hover)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
