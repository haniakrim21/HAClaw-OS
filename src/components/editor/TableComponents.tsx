'use client'

import { useState, useCallback, useEffect, type ComponentPropsWithRef } from 'react'
import { PlateElement, useEditorRef, useSelected } from 'platejs/react'
import { TableProvider, useTableCellElement } from '@platejs/table/react'
import { insertTableRow, insertTableColumn } from '@platejs/table'
import { Editor, Node, Transforms, type Path } from 'slate'
import { ReactEditor } from 'slate-react'

// ── Table Floating Toolbar ──────────────────────────────

function TableFloatingToolbar({
  tablePath,
   
  editor,
}: {
  tablePath: Path
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any
}) {
  const handleInsertRow = useCallback((before: boolean) => {
    try {
      Transforms.select(editor, Editor.start(editor, tablePath))
      ReactEditor.focus(editor)
      insertTableRow(editor, { at: tablePath, before })
    } catch { /* ignore */ }
  }, [editor, tablePath])

  const handleInsertCol = useCallback((before: boolean) => {
    try {
      Transforms.select(editor, Editor.start(editor, tablePath))
      ReactEditor.focus(editor)
      insertTableColumn(editor, { at: tablePath, before })
    } catch { /* ignore */ }
  }, [editor, tablePath])

  const handleDeleteRow = useCallback(() => {
    if (!editor.selection) return
    try {
      const cellEntry = Editor.above(editor, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (n: any) => (n as any).type === 'td' || (n as any).type === 'th',
      })
      if (!cellEntry) return
      const rowPath = cellEntry[1].slice(0, -1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableNode = Node.get(editor, tablePath) as any
      if (tableNode.children.length <= 1) {
        Transforms.removeNodes(editor, { at: tablePath })
      } else {
        Transforms.removeNodes(editor, { at: rowPath })
      }
    } catch { /* ignore */ }
  }, [editor, tablePath])

  const handleDeleteCol = useCallback(() => {
    if (!editor.selection) return
    try {
      const cellEntry = Editor.above(editor, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (n: any) => (n as any).type === 'td' || (n as any).type === 'th',
      })
      if (!cellEntry) return
      const colIdx = cellEntry[1][cellEntry[1].length - 1]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = Node.get(editor, tablePath) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstRow = tbl.children[0] as any
      if (firstRow.children.length <= 1) {
        Transforms.removeNodes(editor, { at: tablePath })
      } else {
        for (let r = tbl.children.length - 1; r >= 0; r--) {
          Transforms.removeNodes(editor, { at: [...tablePath, r, colIdx] })
        }
      }
    } catch { /* ignore */ }
  }, [editor, tablePath])

  const handleDeleteTable = useCallback(() => {
    try { Transforms.removeNodes(editor, { at: tablePath }) } catch { /* ignore */ }
  }, [editor, tablePath])

  const btn = 'h-6 px-1.5 rounded text-[11px] cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] text-[var(--muted)] hover:text-[var(--fg)]'
  const danger = 'h-6 px-1.5 rounded text-[11px] cursor-pointer transition-all text-[var(--red)] hover:bg-[rgba(251,113,133,0.08)]'

  return (
    <div
      contentEditable={false}
      className="absolute -top-9 left-0 z-10 flex items-center gap-px px-1 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/30 select-none whitespace-nowrap"
    >
      <span className="text-[10px] text-[var(--muted-2)] px-1">Row</span>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleInsertRow(false) }} className={btn} title="Add row below">+</button>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleDeleteRow() }} className={danger} title="Remove current row">−</button>

      <div className="w-px h-4 bg-[var(--border)] mx-1" />

      <span className="text-[10px] text-[var(--muted-2)] px-1">Col</span>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleInsertCol(false) }} className={btn} title="Add column right">+</button>
      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleDeleteCol() }} className={danger} title="Remove current column">−</button>

      <div className="w-px h-4 bg-[var(--border)] mx-1" />

      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleDeleteTable() }} className={danger} title="Delete entire table">
        ✕
      </button>
    </div>
  )
}

// ── Table Element (wrapper) ───────────────────────────

export function TableElement(props: ComponentPropsWithRef<typeof PlateElement>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditorRef() as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = (props as any).element
  const selected = useSelected()

  const [tablePath, setTablePath] = useState<Path | null>(null)
  useEffect(() => {
    try {
      setTablePath(ReactEditor.findPath(editor, element))
    } catch { /* ignore */ }
  }, [editor, element])

  return (
    <TableProvider>
      <PlateElement
        {...props}
        className="slate-table"
      >
        {/* Toolbar above table — in block flow, not inside <table> */}
        {selected && tablePath && (
          <TableFloatingToolbar editor={editor} tablePath={tablePath} />
        )}
        <table className="w-full border-collapse table-fixed">
          <tbody>{props.children}</tbody>
        </table>
      </PlateElement>
    </TableProvider>
  )
}

// ── Table Row Element ─────────────────────────────────

export function TableRowElement(props: ComponentPropsWithRef<typeof PlateElement>) {
  return (
    <PlateElement {...props} className="slate-tr">
      {props.children}
    </PlateElement>
  )
}

// ── Table Cell Element (td / th) ──────────────────────

export function TableCellElement(props: ComponentPropsWithRef<typeof PlateElement>) {
  const cellData = useTableCellElement()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = (props as any).element
  const isHeader = element?.type === 'th'
  const cellSelected = cellData?.selected ?? false

  return (
    <PlateElement
      {...props}
      className={[
        isHeader ? 'slate-th' : 'slate-td',
        cellSelected ? 'bg-[rgba(167,139,250,0.08)]' : '',
      ].join(' ')}
    >
      {props.children}
    </PlateElement>
  )
}
