import { createPlatePlugin } from 'platejs/react'
import { Editor, Element, Node, Transforms, Path } from 'slate'
import { emptyParagraph } from './constants'

/**
 * Custom plugin: exit code blocks / tables on Enter, handle toggle deletion
 * Enter = exit block, Shift+Enter = continue within
 * Backspace = convert toggle to paragraph, unindent toggle content
 * Plate v52 handler signature: ({ editor, event }) => void
 */
export const BlockExitPlugin = createPlatePlugin({
  key: 'block-exit',
  handlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onKeyDown: ({ editor: ed, event: e }: { editor: any; event: any }) => {
      // ── Backspace handling ──
      if (e.key === 'Backspace' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        if (!ed.selection) return
        // Only handle collapsed selection at start of block
        const { anchor } = ed.selection
        const block = Editor.above(ed, {
          match: (n: unknown) => !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(ed, n),
        })
        if (!block) return
        const [blockNode, blockPath] = block
        const isAtStart = Editor.isStart(ed, anchor, blockPath)
        if (!isAtStart) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blockType = (blockNode as any).type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blockIndent = (blockNode as any).indent

        // Backspace at start of toggle heading → convert to paragraph
        if (blockType === 'toggle') {
          e.preventDefault()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Transforms.setNodes(ed, { type: 'p' } as any, { at: blockPath })
          return
        }

        // Backspace at start of indented content (inside toggle zone) → unindent
        if (blockIndent && blockIndent >= 1) {
          e.preventDefault()
          if (blockIndent === 1) {
            Transforms.unsetNodes(ed, 'indent', { at: blockPath })
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Transforms.setNodes(ed, { indent: blockIndent - 1 } as any, { at: blockPath })
          }
          return
        }

        return
      }

      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey) return

      // ── Toggle: Enter → create indented content below, empty → convert to p ──
      const toggleEntries = Array.from(
        Editor.nodes(ed, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          match: (n: unknown) => Element.isElement(n) && (n as any).type === 'toggle',
        })
      )
      if (toggleEntries.length > 0 && !e.shiftKey) {
        const [node, path] = toggleEntries[0]
        if (Node.string(node) === '') {
          // Empty toggle → convert to paragraph
          e.preventDefault()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Transforms.setNodes(ed, { type: 'p' } as any, { at: path })
          return
        }
        // Non-empty toggle → create indented paragraph below for content
        if (ed.selection && Editor.isEnd(ed, ed.selection.anchor, path)) {
          e.preventDefault()
          const nextPath = Path.next(path)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Transforms.insertNodes(ed, { type: 'p', indent: 1, children: [{ text: '' }] } as any, { at: nextPath })
          Transforms.select(ed, Editor.start(ed, nextPath))
          return
        }
      }

      // ── Todo: Enter → exit to paragraph, Shift+Enter → new todo ──
      const todoEntries = Array.from(
        Editor.nodes(ed, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          match: (n: unknown) => Element.isElement(n) && (n as any).type === 'todo',
        })
      )
      if (todoEntries.length > 0) {
        const [node, path] = todoEntries[0]
        if (e.shiftKey) {
          // Shift+Enter → create new todo below (continue list)
          e.preventDefault()
          const nextPath = Path.next(path)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Transforms.insertNodes(ed, { type: 'todo', checked: false, children: [{ text: '' }] } as any, { at: nextPath })
          Transforms.select(ed, Editor.start(ed, nextPath))
          return
        }
        // Enter → exit to paragraph
        e.preventDefault()
        if (Node.string(node) === '') {
          // Empty todo → convert to paragraph
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Transforms.setNodes(ed, { type: 'p' } as any, { at: path })
          Transforms.unsetNodes(ed, 'checked', { at: path })
        } else {
          // Non-empty todo → create paragraph below
          const nextPath = Path.next(path)
          Transforms.insertNodes(ed, emptyParagraph(), { at: nextPath })
          Transforms.select(ed, Editor.start(ed, nextPath))
        }
        return
      }

      // Shift+Enter = continue within block (default) for other block types
      if (e.shiftKey) return

      // ── Heading exit: Enter at end of heading → new paragraph ──
      const headingEntries = Array.from(
        Editor.nodes(ed, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          match: (n: unknown) => Element.isElement(n) && ['h1', 'h2', 'h3'].includes((n as any).type),
        })
      )
      if (headingEntries.length > 0) {
        const [, path] = headingEntries[0]
        if (ed.selection && Editor.isEnd(ed, ed.selection.anchor, path)) {
          e.preventDefault()
          const nextPath = Path.next(path)
          Transforms.insertNodes(ed, emptyParagraph(), { at: nextPath })
          Transforms.select(ed, Editor.start(ed, nextPath))
          return
        }
      }

      // ── Code block exit: Enter on empty last code_line → exit ──
      const codeLineEntries = Array.from(
        Editor.nodes(ed, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          match: (n: unknown) => Element.isElement(n) && (n as any).type === 'code_line',
        })
      )
      if (codeLineEntries.length > 0) {
        const [node, path] = codeLineEntries[0]
        if (Node.string(node) !== '') return

        const parentPath = path.slice(0, -1)
        const parent = Node.get(ed, parentPath) as Element
        const childIdx = path[path.length - 1]
        if (childIdx === 0 || childIdx !== parent.children.length - 1) return

        e.preventDefault()
        Transforms.removeNodes(ed, { at: path })
        const nextPath = Path.next(parentPath)
        Transforms.insertNodes(ed, emptyParagraph(), { at: nextPath })
        Transforms.select(ed, Editor.start(ed, nextPath))
        return
      }

      // ── Table exit: Enter on empty last cell → exit ──
      const tableEntries = Array.from(
        Editor.nodes(ed, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          match: (n: unknown) => Element.isElement(n) && (n as any).type === 'table',
        })
      )
      if (tableEntries.length > 0) {
        const block = Editor.above(ed, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          match: (n: unknown) => Element.isElement(n) && Editor.isBlock(ed, n) && (n as any).type === 'p',
        })
        if (!block) return
        const [pNode] = block
        if (Node.string(pNode) !== '') return
        if (!ed.selection || !Editor.isEnd(ed, ed.selection.anchor, block[1])) return

        const [, tablePath] = tableEntries[0]
        const tableNode = Node.get(ed, tablePath) as Element
        const lastRowIdx = tableNode.children.length - 1
        const lastRow = tableNode.children[lastRowIdx] as Element
        const lastCellIdx = lastRow.children.length - 1
        const lastCellPath = [...tablePath, lastRowIdx, lastCellIdx]

        const pPath = block[1]
        const cellPath = pPath.slice(0, lastCellPath.length)
        const isLastCell = cellPath.every((v: number, i: number) => v === lastCellPath[i])
        if (!isLastCell) return

        e.preventDefault()
        const nextPath = Path.next(tablePath)
        Transforms.insertNodes(ed, emptyParagraph(), { at: nextPath })
        Transforms.select(ed, Editor.start(ed, nextPath))
      }
    },
  },
})
