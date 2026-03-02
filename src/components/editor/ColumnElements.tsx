'use client'

import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ColumnGroupElement({ attributes, children }: any) {
  return (
    <div
      {...attributes}
      className="flex gap-4 my-3 [&>*]:flex-1 [&>*]:min-w-0 max-sm:flex-col"
    >
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ColumnItemElement({ attributes, children }: any) {
  return (
    <div
      {...attributes}
      className="border-l border-[var(--border)] pl-4 first:border-l-0 first:pl-0 max-sm:border-l-0 max-sm:pl-0 max-sm:border-t max-sm:border-[var(--border)] max-sm:pt-3 max-sm:first:border-t-0 max-sm:first:pt-0"
    >
      {children}
    </div>
  )
}
