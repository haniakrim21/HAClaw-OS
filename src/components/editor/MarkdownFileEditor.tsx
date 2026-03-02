'use client'

import { useState, useCallback } from 'react'
import { createPlateEditor } from 'platejs/react'
import {
  BoldPlugin, ItalicPlugin, StrikethroughPlugin, CodePlugin,
  HeadingPlugin, BlockquotePlugin, HorizontalRulePlugin,
} from '@platejs/basic-nodes/react'
import { ListPlugin } from '@platejs/list/react'
import { LinkPlugin } from '@platejs/link/react'
import { CodeBlockPlugin, CodeLinePlugin } from '@platejs/code-block/react'
import { MarkdownPlugin } from '@platejs/markdown'
import { NoteEditor } from './NoteEditor'
import { slateToMarkdown } from '@/lib/slate-to-markdown'

const DESERIALIZE_PLUGINS = [
  BoldPlugin, ItalicPlugin, StrikethroughPlugin, CodePlugin,
  HeadingPlugin, BlockquotePlugin, HorizontalRulePlugin,
  ListPlugin, LinkPlugin, CodeBlockPlugin, CodeLinePlugin,
  MarkdownPlugin,
]

function markdownToSlate(markdown: string): unknown[] {
  const editor = createPlateEditor({ plugins: DESERIALIZE_PLUGINS })
  const nodes = editor.api.markdown.deserialize(markdown)
  return nodes?.length ? nodes : [{ type: 'p', children: [{ text: '' }] }]
}

interface MarkdownFileEditorProps {
  initialMarkdown: string
  onChange?: (markdown: string) => void
  readOnly?: boolean
}

export function MarkdownFileEditor({ initialMarkdown, onChange, readOnly = false }: MarkdownFileEditorProps) {
  const [initialValue] = useState(() => markdownToSlate(initialMarkdown))

  const handleChange = useCallback((value: unknown[]) => {
    if (onChange) onChange(slateToMarkdown(value))
  }, [onChange])

  return (
    <NoteEditor
      initialValue={initialValue}
      onChange={handleChange}
      readOnly={readOnly}
      placeholder="Start writing..."
      showToolbar={!readOnly}
      minHeight="300px"
      compact
    />
  )
}
