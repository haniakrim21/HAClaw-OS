'use client'

import React, { useState, useCallback } from 'react'
import { useEditorRef } from 'platejs/react'
import { Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ImageElement({ attributes, children, element }: any) {
  const editor = useEditorRef()
  const [isResizing, setIsResizing] = useState(false)
  const [width, setWidth] = useState<number | undefined>(element.width)

  const url = element.url as string
  const alt = (element.alt as string) || ''

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = width || (e.currentTarget.parentElement?.getBoundingClientRect().width ?? 600)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX
      const newWidth = Math.max(100, Math.min(startWidth + diff, 1000))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // Persist width to node
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const path = ReactEditor.findPath(editor as any, element)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Transforms.setNodes(editor as any, { width: width } as any, { at: path })
      } catch {
        // ignore
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [editor, element, width])

  if (!url) return <div {...attributes}>{children}</div>

  return (
    <div {...attributes} className="my-3 relative group">
      <div contentEditable={false} className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="rounded-lg border border-[var(--border)] max-w-full"
          style={{
            width: width ? `${width}px` : '100%',
            display: 'block',
            cursor: isResizing ? 'col-resize' : 'default',
          }}
          draggable={false}
        />
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(167, 139, 250, 0.3)' }}
        />
      </div>
      {children}
    </div>
  )
}
