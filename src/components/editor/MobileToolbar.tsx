'use client'

import { useEditorRef, useEditorSelector } from 'platejs/react'
import { Transforms, Editor, Element } from 'slate'

 
function useActiveMarks(): Record<string, boolean> {
  return useEditorSelector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any) => {
      try {
        const m = Editor.marks(editor) as Record<string, unknown> | null
        if (!m) return {}
        const result: Record<string, boolean> = {}
        for (const key of ['bold', 'italic', 'underline', 'strikethrough', 'code']) {
          if (m[key]) result[key] = true
        }
        return result
      } catch {
        return {}
      }
    },
    [],
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
  )
}

function useActiveBlockType(): string {
  return useEditorSelector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any) => {
      try {
        const { selection } = editor
        if (!selection) return 'p'
        const entries = Array.from(
          Editor.nodes(editor, {
            match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n),
          })
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (entries[0]?.[0] as any)?.type ?? 'p'
      } catch {
        return 'p'
      }
    },
    []
  )
}

const MARK_ITEMS = [
  { key: 'bold', label: 'B', style: 'font-bold' },
  { key: 'italic', label: 'I', style: 'italic' },
  { key: 'underline', label: 'U', style: 'underline' },
  { key: 'strikethrough', label: 'S', style: 'line-through' },
  { key: 'code', label: '</>', style: 'font-mono text-[10px]' },
] as const

const BLOCK_ITEMS = [
  { type: 'h1', label: 'H1' },
  { type: 'h2', label: 'H2' },
  { type: 'h3', label: 'H3' },
  { type: 'blockquote', label: '❝' },
  { type: 'todo', label: '☐' },
] as const

export function MobileToolbar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditorRef() as any
  const activeMarks = useActiveMarks()
  const activeBlock = useActiveBlockType()

  const toggleMark = (e: React.MouseEvent, key: string) => {
    e.preventDefault()
    const marks = Editor.marks(editor) as Record<string, boolean> | null
    if (marks?.[key]) Editor.removeMark(editor, key)
    else Editor.addMark(editor, key, true)
  }

  const toggleBlock = (e: React.MouseEvent, type: string) => {
    e.preventDefault()
    try {
      const isActive = activeBlock === type
      if (type === 'todo') {
        Transforms.setNodes(
          editor,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          isActive ? { type: 'p', checked: undefined } as any : { type: 'todo', checked: false } as any,
          { match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n) }
        )
        if (isActive) {
          Transforms.unsetNodes(editor, 'checked', {
            match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n),
          })
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Transforms.setNodes(editor, { type: isActive ? 'p' : type } as any, {
          match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n),
        })
      }
    } catch { /* ignore */ }
  }

  const inactive = 'min-w-[44px] h-[44px] flex items-center justify-center rounded-lg text-sm transition-all text-[var(--muted)] active:bg-[var(--hover)]'
  const active = 'min-w-[44px] h-[44px] flex items-center justify-center rounded-lg text-sm transition-all text-[var(--neon)] bg-[rgba(167,139,250,0.12)]'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[var(--border)] bg-[var(--bg)] safe-area-pb">
      <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto">
        {/* Marks */}
        {MARK_ITEMS.map(({ key, label, style }) => (
          <button
            key={key}
            type="button"
            onMouseDown={(e) => toggleMark(e, key)}
            className={`${activeMarks[key] ? active : inactive} ${style} shrink-0`}
          >
            {label}
          </button>
        ))}

        <div className="w-px h-8 bg-[var(--border)] mx-1 shrink-0" />

        {/* Blocks */}
        {BLOCK_ITEMS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onMouseDown={(e) => toggleBlock(e, type)}
            className={`${activeBlock === type ? active : inactive} shrink-0`}
          >
            {label}
          </button>
        ))}

        <div className="w-px h-8 bg-[var(--border)] mx-1 shrink-0" />

        {/* Undo / Redo */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.undo() }}
          className={`${inactive} shrink-0`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 0 1 0 10H9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6L3 10l4 4" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.redo() }}
          className={`${inactive} shrink-0`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 0 0 0 10h4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
