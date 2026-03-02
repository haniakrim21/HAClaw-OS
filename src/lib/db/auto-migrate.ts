import fs from 'node:fs'
import path from 'node:path'
import { getPool } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const log = createLogger('auto-migrate')

/**
 * Run pending database migrations on server startup.
 * Uses the app's connection pool — no extra connections needed.
 * Non-fatal: logs errors but does NOT crash the server.
 */
export async function runPendingMigrations(): Promise<void> {
  const migrationsDir = path.join(process.cwd(), 'db', 'migrations')

  if (!fs.existsSync(migrationsDir)) {
    log.warn('Migrations directory not found, skipping', { path: migrationsDir })
    return
  }

  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(`CREATE TABLE IF NOT EXISTS core._migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`)

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let applied = 0

    for (const file of files) {
      const already = await client.query('SELECT 1 FROM core._migrations WHERE id=$1', [file])
      if (already.rowCount) continue

      let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

      // PostgreSQL 16 doesn't support IF NOT EXISTS on CREATE POLICY
      sql = sql.replace(/create policy if not exists /gi, 'create policy ')

      log.info('Applying migration', { file })

      try {
        await client.query(sql)
      } catch (err: unknown) {
        const pgErr = err as { code?: string }
        if (pgErr.code === '42P08') {
          log.info('Policy already exists, continuing', { file })
        } else {
          throw err
        }
      }

      await client.query('INSERT INTO core._migrations (id) VALUES ($1)', [file])
      applied++
    }

    await client.query('COMMIT')

    if (applied > 0) {
      log.info('Migrations complete', { applied })
    } else {
      log.info('No pending migrations')
    }
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch { /* ignore rollback error */ }
    log.error('Migration failed', { error: e instanceof Error ? e.message : String(e) })
  } finally {
    client.release()
  }
}
