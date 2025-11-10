'use server';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { join } from 'node:path';

const sqlitePath = join(process.cwd(), 'sqlite.db');

function createClient() {
  const sqlite = new Database(sqlitePath);
  sqlite.pragma('journal_mode = WAL');
  return drizzle(sqlite);
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
