'use client'

import { useEditorRef, useEditorSelector } from 'platejs/react'
import { Transforms, Editor, Element, Node } from 'slate'
import { emptyParagraph } from './constants'

// ── Config ────────────────────────────────────────────────

const MARKS = [
  { key: 'bold', label: 'B', title: 'Bold (Ctrl+B)', style: 'font-bold' },
  { key: 'italic', label: 'I', title: 'Italic (Ctrl+I)', style: 'italic' },
  { key: 'underline', label: 'U', title: 'Underline (Ctrl+U)', style: 'underline' },
  { key: 'strikethrough', label: 'S', title: 'Strikethrough', style: 'line-through' },
  { key: 'code', label: '</>', title: 'Inline code', style: 'font-mono text-[11px]' },
] as const

const BLOCKS = [
  { type: 'h1', label: 'H1', title: 'Heading 1' },
  { type: 'h2', label: 'H2', title: 'Heading 2' },
  { type: 'h3', label: 'H3', title: 'Heading 3' },
  { type: 'blockquote', label: '❝', title: 'Quote' },
  { type: 'todo', label: '☐', title: 'Todo' },
] as const

// ── Selectors ─────────────────────────────────────────────

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

function useHistoryState(): { canUndo: boolean; canRedo: boolean } {
  return useEditorSelector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any) => {
      try {
        return {
          canUndo: (editor.history?.undos?.length ?? 0) > 0,
          canRedo: (editor.history?.redos?.length ?? 0) > 0,
        }
      } catch {
        return { canUndo: false, canRedo: false }
      }
    },
    [],
    { equalityFn: (a, b) => a.canUndo === b.canUndo && a.canRedo === b.canRedo }
  )
}

// ── Component ─────────────────────────────────────────────

export function EditorToolbar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditorRef() as any
  const activeMarks = useActiveMarks()
  const activeBlock = useActiveBlockType()
  const { canUndo, canRedo } = useHistoryState()

  const toggleMark = (e: React.MouseEvent, key: string) => {
    e.preventDefault()
    const marks = Editor.marks(editor) as Record<string, boolean> | null
    if (marks?.[key]) {
      Editor.removeMark(editor, key)
    } else {
      Editor.addMark(editor, key, true)
    }
  }

  const toggleBlock = (e: React.MouseEvent, type: string) => {
    e.preventDefault()
    try {
      const isActive = activeBlock === type
      if (type === 'todo') {
        // Todo needs the `checked` property
        Transforms.setNodes(
          editor,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          isActive ? { type: 'p', checked: undefined } as any : { type: 'todo', checked: false } as any,
          { match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n) }
        )
        // Clean up the checked property when toggling back to paragraph
        if (isActive) {
          Transforms.unsetNodes(editor, 'checked', {
            match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n),
          })
        }
      } else {
        Transforms.setNodes(
          editor,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: isActive ? 'p' : type } as any,
          { match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n) }
        )
      }
    } catch {
      // selection might be collapsed or invalid
    }
  }

  const insertCodeBlock = (e: React.MouseEvent) => {
    e.preventDefault()
    // If current block is an empty paragraph, remove it first so the code block replaces it
    try {
      const [match] = Editor.nodes(editor, {
        match: (n: unknown) => {
          if (!Element.isElement(n)) return false
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (n as any).type === 'p' && Node.string(n) === ''
        },
        mode: 'lowest',
      })
      if (match) Transforms.removeNodes(editor, { at: match[1] })
    } catch { /* ignore */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Transforms.insertNodes(editor, { type: 'code_block', children: [{ type: 'code_line', children: [{ text: '' }] }] } as any)
  }

  const insertTable = (e: React.MouseEvent) => {
    e.preventDefault()
    const cell = () => ({ type: 'td', children: [emptyParagraph()] })
    const row = () => ({ type: 'tr', children: [cell(), cell(), cell()] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Transforms.insertNodes(editor, [{ type: 'table', children: [row(), row(), row()] }, emptyParagraph()] as any)
  }

  const insertDivider = (e: React.MouseEvent) => {
    e.preventDefault()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Transforms.insertNodes(editor, [{ type: 'hr', children: [{ text: '' }] }, emptyParagraph()] as any)
  }

  const inactive =
    'px-2.5 py-1.5 rounded-md text-xs transition-all text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--hover)] shrink-0'
  const active =
    'px-2.5 py-1.5 rounded-md text-xs transition-all text-[var(--neon)] bg-[rgba(167,139,250,0.12)] shrink-0'

  return (
    <div className="flex items-center gap-0.5 px-2 py-2 border-b border-[var(--border)] mb-3 overflow-x-auto">
      {/* Mark buttons */}
      {MARKS.map(({ key, label, title, style }) => (
        <button
          key={key}
          type="button"
          onMouseDown={(e) => toggleMark(e, key)}
          title={title}
          className={`${activeMarks[key] ? active : inactive} ${style}`}
        >
          {label}
        </button>
      ))}

      <div className="w-px h-6 bg-[var(--border)] mx-1.5" />

      {/* Block buttons */}
      {BLOCKS.map(({ type, label, title }) => (
        <button
          key={type}
          type="button"
          onMouseDown={(e) => toggleBlock(e, type)}
          title={title}
          className={activeBlock === type ? active : inactive}
        >
          {label}
        </button>
      ))}

      <div className="w-px h-6 bg-[var(--border)] mx-1.5" />

      {/* Insert buttons */}
      <button type="button" onMouseDown={insertCodeBlock} title="Code block" className={activeBlock === 'code_block' ? active : inactive}>
        <span className="font-mono text-[11px] whitespace-nowrap">{'{ }'}</span>
      </button>
      <button type="button" onMouseDown={insertTable} title="Table (3x3)" className={inactive}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
          <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
          <line x1="1.5" y1="6" x2="14.5" y2="6" />
          <line x1="1.5" y1="10.5" x2="14.5" y2="10.5" />
          <line x1="6" y1="1.5" x2="6" y2="14.5" />
          <line x1="10.5" y1="1.5" x2="10.5" y2="14.5" />
        </svg>
      </button>
      <button type="button" onMouseDown={insertDivider} title="Divider" className={inactive}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <line x1="2" y1="8" x2="14" y2="8" />
        </svg>
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1.5" />

      {/* Undo / Redo */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.undo() }}
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        className={`${inactive} disabled:opacity-30 disabled:pointer-events-none`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 0 1 0 10H9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 6L3 10l4 4" />
        </svg>
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.redo() }}
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        className={`${inactive} disabled:opacity-30 disabled:pointer-events-none`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 0 0 0 10h4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l4 4-4 4" />
        </svg>
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1.5" />

      {/* Hint */}
      <span className="text-[10px] text-[var(--muted-2)] ml-1 hidden md:inline whitespace-nowrap">
        / commands &middot; Ctrl+Z undo
      </span>
    </div>
  )
}
