'use client'

import { type ComponentPropsWithRef } from 'react'
import { PlateElement } from 'platejs/react'
import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react'

/**
 * Toggle element — official Plate pattern with useToggleButton hooks.
 * Chevron rotates when open/closed. Content hidden when collapsed.
 */
export function ToggleElement(props: ComponentPropsWithRef<typeof PlateElement>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = (props as any).element
  const state = useToggleButtonState(element.id as string)
  const { buttonProps, open } = useToggleButton(state)

  return (
    <PlateElement {...props} className="relative pl-8 my-2">
      <button
        type="button"
        contentEditable={false}
        className="absolute -left-0.5 top-0.5 w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--hover)] transition-colors select-none cursor-pointer"
        {...buttonProps}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-75 ${open ? 'rotate-90' : 'rotate-0'}`}
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M6 3l5 5-5 5V3z" />
        </svg>
      </button>
      {props.children}
    </PlateElement>
  )
}
