import type { PoolClient } from 'pg'
import { createLogger } from '@/lib/logger'

const log = createLogger('og-image')

const OG_CONCURRENCY = 6
const OG_TIMEOUT = 5_000

/**
 * Extract og:image from an article URL by fetching just the <head>.
 * Returns the image URL or null.
 */
async function fetchArticleImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HAClaw-OS/1.0 (RSS Reader)' },
      signal: AbortSignal.timeout(OG_TIMEOUT),
      redirect: 'follow',
    })
    if (!res.ok) return null

    // Read up to ~64KB to find images in head and early body
    const reader = res.body?.getReader()
    if (!reader) return null

    let html = ''
    const decoder = new TextDecoder()
    while (html.length < 65_536) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
    }
    reader.cancel().catch(() => {})

    // 1. Try og:image or twitter:image from meta tags
    const ogMatch = html.match(
      /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/i
    )

    if (ogMatch?.[1] && /^https?:\/\//.test(ogMatch[1])) {
      return ogMatch[1]
    }

    // 2. Find first substantial <img> in the page (skip tiny icons/trackers)
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    let match
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[0]
      const imgUrl = match[1]
      if (!imgUrl || !/^https?:\/\//.test(imgUrl)) continue
      // Skip tracking pixels, avatars, logos (small images)
      if (/1x1|pixel|track|beacon|badge|icon|logo|avatar|favicon|sprite/i.test(src)) continue
      // Skip data URIs and SVGs
      if (/^data:|\.svg/i.test(imgUrl)) continue
      // Prefer images with width/height hints suggesting they're content images
      const widthMatch = src.match(/width=["']?(\d+)/i)
      if (widthMatch && parseInt(widthMatch[1]) < 50) continue
      return imgUrl
    }

    return null
  } catch {
    return null
  }
}

/**
 * Backfill og:image for news items that have a URL but no image.
 * Runs in batches with concurrency limit. Non-blocking — errors are swallowed.
 */
export async function backfillOgImages(
  client: PoolClient,
  workspaceId: string,
  limit: number = 30
): Promise<number> {
  const { rows } = await client.query<{ id: string; url: string }>(
    `SELECT id, url FROM content.news_item
     WHERE workspace_id = $1 AND image_url IS NULL AND url IS NOT NULL AND url != ''
     ORDER BY published_at DESC NULLS LAST
     LIMIT $2`,
    [workspaceId, limit]
  )

  if (rows.length === 0) return 0

  let updated = 0

  for (let i = 0; i < rows.length; i += OG_CONCURRENCY) {
    const batch = rows.slice(i, i + OG_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async (row) => {
        const imageUrl = await fetchArticleImage(row.url)
        return { id: row.id, imageUrl }
      })
    )

    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value.imageUrl) continue
      try {
        await client.query(
          'UPDATE content.news_item SET image_url = $1 WHERE id = $2 AND image_url IS NULL',
          [r.value.imageUrl, r.value.id]
        )
        updated++
      } catch {
        // ignore individual update failures
      }
    }
  }

  if (updated > 0) {
    log.info('Backfilled og:image', { workspace: workspaceId, updated, checked: rows.length })
  }

  return updated
}
