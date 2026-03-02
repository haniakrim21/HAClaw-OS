import { describe, it, expect, vi } from 'vitest'

// Test extractPreview and timeAgo logic without React rendering
// (Since NoteCard is a visual component, we test the pure logic)

// Re-implement extractPreview from NoteCard for direct testing
function extractPreview(content: unknown[], maxLen = 120): string {
  const texts: string[] = []

  function walk(nodes: unknown[]) {
    for (const node of nodes) {
      if (typeof node !== 'object' || node === null) continue
      const n = node as Record<string, unknown>
      if (typeof n.text === 'string' && n.text) texts.push(n.text)
      if (Array.isArray(n.children)) walk(n.children)
    }
  }

  walk(content)
  const joined = texts.join(' ').replace(/\s+/g, ' ').trim()
  return joined.length > maxLen ? joined.slice(0, maxLen) + '...' : joined
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

describe('NoteCard helpers', () => {
  describe('extractPreview', () => {
    it('extracts text from simple paragraph', () => {
      const content = [{ type: 'p', children: [{ text: 'Hello world' }] }]
      expect(extractPreview(content)).toBe('Hello world')
    })

    it('extracts text from multiple paragraphs', () => {
      const content = [
        { type: 'p', children: [{ text: 'First' }] },
        { type: 'p', children: [{ text: 'Second' }] },
      ]
      expect(extractPreview(content)).toBe('First Second')
    })

    it('extracts text from nested nodes (bold, italic)', () => {
      const content = [
        {
          type: 'p',
          children: [
            { text: 'Normal ' },
            { text: 'bold', bold: true },
            { text: ' and ' },
            { text: 'italic', italic: true },
          ],
        },
      ]
      expect(extractPreview(content)).toBe('Normal bold and italic')
    })

    it('handles empty content', () => {
      expect(extractPreview([])).toBe('')
    })

    it('handles content with empty text nodes', () => {
      const content = [{ type: 'p', children: [{ text: '' }] }]
      expect(extractPreview(content)).toBe('')
    })

    it('truncates long content with ellipsis', () => {
      const longText = 'a'.repeat(200)
      const content = [{ type: 'p', children: [{ text: longText }] }]
      const result = extractPreview(content)
      expect(result.length).toBe(123) // 120 + '...'
      expect(result.endsWith('...')).toBe(true)
    })

    it('respects custom maxLen', () => {
      const content = [{ type: 'p', children: [{ text: 'Hello world this is a test' }] }]
      const result = extractPreview(content, 10)
      expect(result).toBe('Hello worl...')
    })

    it('handles headings', () => {
      const content = [
        { type: 'h1', children: [{ text: 'Title' }] },
        { type: 'p', children: [{ text: 'Body' }] },
      ]
      expect(extractPreview(content)).toBe('Title Body')
    })

    it('handles blockquotes with nested children', () => {
      const content = [
        {
          type: 'blockquote',
          children: [{ type: 'p', children: [{ text: 'Quoted text' }] }],
        },
      ]
      expect(extractPreview(content)).toBe('Quoted text')
    })

    it('handles null and non-object nodes gracefully', () => {
      const content = [null, undefined, 42, 'string', { type: 'p', children: [{ text: 'OK' }] }] as unknown[]
      expect(extractPreview(content)).toBe('OK')
    })

    it('collapses whitespace', () => {
      const content = [
        { type: 'p', children: [{ text: 'Hello   world' }] },
        { type: 'p', children: [{ text: '  test  ' }] },
      ]
      expect(extractPreview(content)).toBe('Hello world test')
    })
  })

  describe('timeAgo', () => {
    it('returns "just now" for very recent dates', () => {
      const now = new Date().toISOString()
      expect(timeAgo(now)).toBe('just now')
    })

    it('returns minutes for recent dates', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
      expect(timeAgo(fiveMinAgo)).toBe('5m ago')
    })

    it('returns hours for older dates', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
      expect(timeAgo(threeHoursAgo)).toBe('3h ago')
    })

    it('returns days for dates within a week', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString()
      expect(timeAgo(twoDaysAgo)).toBe('2d ago')
    })

    it('returns formatted date for older than 7 days', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString()
      const result = timeAgo(twoWeeksAgo)
      // Should be a localized date string, not "Xd ago"
      expect(result).not.toContain('ago')
    })
  })
})
