#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function log(msg) { console.log(`[reset-db] ${msg}`); }

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'app.db');

// Ensure data dir exists
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Backup if exists
if (fs.existsSync(dbPath)) {
  const backupsDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const backupPath = path.join(backupsDir, `app-${ts}.db`);
  fs.copyFileSync(dbPath, backupPath);
  log(`Backup created: ${path.relative(process.cwd(), backupPath)}`);
}

// Remove DB + SQLite side files
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (fs.existsSync(f)) {
    fs.rmSync(f);
    log(`Removed: ${path.relative(process.cwd(), f)}`);
  }
}

log('DB files removed. Run `npm run migrate` or just `npm run dev` to recreate schema.');
