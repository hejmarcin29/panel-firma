// Runtime migrations for SQLite using Drizzle migrator (ESM)
import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const dbUrl = process.env.DATABASE_URL || 'file:./data/app.db'
const filePath = dbUrl.startsWith('file:') ? dbUrl.slice(5) : dbUrl
const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)

// Ensure DB directory exists
fs.mkdirSync(path.dirname(absPath), { recursive: true })

const sqlite = new Database(absPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 5000')
sqlite.pragma('foreign_keys = ON')

const db = drizzle(sqlite)

try {
  const migrationsFolder = path.join(process.cwd(), 'drizzle')
  console.log('[migrate] Starting migrations from', migrationsFolder)
  await migrate(db, { migrationsFolder })
  console.log('[migrate] Migrations completed')
} catch (err) {
  console.error('[migrate] Migration failed', err)
  process.exit(1)
}
