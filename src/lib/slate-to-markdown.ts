/** Convert Plate JSON (Slate nodes) to Markdown */
export function slateToMarkdown(nodes: unknown[]): string {
  const lines: string[] = []

  function inlineText(children: unknown[]): string {
    return children.map((child) => {
      if (typeof child !== 'object' || child === null) return ''
      const n = child as Record<string, unknown>
      if (typeof n.text === 'string') {
        let t = n.text
        if (n.bold) t = `**${t}**`
        if (n.italic) t = `*${t}*`
        if (n.strikethrough) t = `~~${t}~~`
        if (n.code) t = `\`${t}\``
        if (n.underline) t = `<u>${t}</u>`
        return t
      }
      if (n.type === 'a' && Array.isArray(n.children)) {
        return `[${inlineText(n.children)}](${n.url ?? ''})`
      }
      if (Array.isArray(n.children)) return inlineText(n.children)
      return ''
    }).join('')
  }

  function walk(node: unknown) {
    if (typeof node !== 'object' || node === null) return
    const n = node as Record<string, unknown>
    const children = Array.isArray(n.children) ? n.children : []
    const text = inlineText(children)

    switch (n.type) {
      case 'h1': lines.push(`# ${text}`); break
      case 'h2': lines.push(`## ${text}`); break
      case 'h3': lines.push(`### ${text}`); break
      case 'blockquote': lines.push(`> ${text}`); break
      case 'code_block':
        lines.push('```')
        children.forEach((c) => walk(c))
        lines.push('```')
        return
      case 'code_line': lines.push(inlineText(children)); return
      case 'hr': lines.push('---'); break
      case 'todo':
        lines.push(`- [${n.checked ? 'x' : ' '}] ${text}`)
        break
      case 'img':
        lines.push(`![${(n.alt as string) || ''}](${(n.url as string) || ''})`)
        break
      case 'column_group':
        children.forEach((col) => {
          if (typeof col !== 'object' || col === null) return
          const c = col as Record<string, unknown>
          if (Array.isArray(c.children)) c.children.forEach((child) => walk(child))
        })
        return
      case 'column':
        children.forEach((child) => walk(child))
        return
      case 'table':
        children.forEach((row, ri) => {
          if (typeof row !== 'object' || row === null) return
          const r = row as Record<string, unknown>
          const cells = Array.isArray(r.children) ? r.children : []
          const cellTexts = cells.map((c) => {
            if (typeof c !== 'object' || c === null) return ''
            const cell = c as Record<string, unknown>
            return Array.isArray(cell.children) ? cell.children.map((p) => {
              if (typeof p !== 'object' || p === null) return ''
              const para = p as Record<string, unknown>
              return Array.isArray(para.children) ? inlineText(para.children) : ''
            }).join(' ') : ''
          })
          lines.push(`| ${cellTexts.join(' | ')} |`)
          if (ri === 0) lines.push(`| ${cellTexts.map(() => '---').join(' | ')} |`)
        })
        return
      default:
        if (text) lines.push(text)
    }
  }

  nodes.forEach((node) => walk(node))
  return lines.join('\n\n')
}
