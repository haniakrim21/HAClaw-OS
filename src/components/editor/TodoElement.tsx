'use client'

import { type ComponentPropsWithRef } from 'react'
import { PlateElement, useEditorRef } from 'platejs/react'
import { ReactEditor } from 'slate-react'
import { Transforms } from 'slate'

/**
 * Custom todo element — renders a checkbox + text.
 * Node shape: { type: 'todo', checked: boolean, children: [{ text: '' }] }
 */
export function TodoElement(props: ComponentPropsWithRef<typeof PlateElement>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditorRef() as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = (props as any).element
  const checked = element?.checked ?? false

  const handleToggle = () => {
    try {
      const path = ReactEditor.findPath(editor, element)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Transforms.setNodes(editor, { checked: !checked } as any, { at: path })
    } catch { /* element may have been removed */ }
  }

  return (
    <PlateElement
      {...props}
      className="flex items-start gap-2.5 my-1"
    >
      <span contentEditable={false} className="select-none pt-[3px] shrink-0">
        <button
          type="button"
          onClick={handleToggle}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
            checked
              ? 'bg-[var(--green)] border-[var(--green)] text-[var(--bg)]'
              : 'border-[var(--border)] hover:border-[var(--neon)]'
          }`}
        >
          {checked && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </span>
      <span
        className={`flex-1 ${checked ? 'line-through text-[var(--muted-2)]' : ''}`}
      >
        {props.children}
      </span>
    </PlateElement>
  )
}
