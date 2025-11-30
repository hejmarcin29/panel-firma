// import 'server-only'; // Disabled to prevent potential build/runtime issues

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

import * as schema from './schema';

// Use an absolute path if provided via env, otherwise default to local file
const sqlitePath = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.replace('file:', '') 
    : join(process.cwd(), 'sqlite.db');

function createClient() {
    console.log(`[DB] Initializing database at: ${sqlitePath}`);
    const dbExists = existsSync(sqlitePath);
    console.log(`[DB] Database file exists: ${dbExists}`);
    
	const sqlite = new Database(sqlitePath);
	sqlite.pragma('journal_mode = WAL');
	return drizzle(sqlite, { schema });
}

type DrizzleClient = ReturnType<typeof createClient>;

type GlobalWithDb = typeof globalThis & {
  __db?: DrizzleClient;
};

const globalForDb = globalThis as GlobalWithDb;

export const db: DrizzleClient = globalForDb.__db ?? createClient();

if (!globalForDb.__db) {
  globalForDb.__db = db;
}
