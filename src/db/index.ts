import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbUrl = process.env.DATABASE_URL || "file:./data/app.db";

// Resolve path from project root for better-sqlite3
const filePath = dbUrl.startsWith("file:") ? dbUrl.slice(5) : dbUrl;
const absPath = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);

// Ensure directory exists
fs.mkdirSync(path.dirname(absPath), { recursive: true });

const sqlite = new Database(absPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);
