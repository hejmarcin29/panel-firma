// Diagnostic script to verify env vars, SQLite access, FS perms, and runtime
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";

function maskSecret(s) {
  if (!s) return null;
  const len = s.length;
  if (len <= 6) return "*".repeat(len);
  return s.slice(0, 3) + "*".repeat(Math.max(0, len - 6)) + s.slice(-3);
}

function resolveDbPath(dbUrl) {
  const url = dbUrl || "file:./data/app.db";
  const filePath = url.startsWith("file:") ? url.slice(5) : url;
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
}

const info = {
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  cwd: process.cwd(),
  user: {
    uid: typeof process.getuid === "function" ? process.getuid() : null,
    gid: typeof process.getgid === "function" ? process.getgid() : null,
    username: os.userInfo?.().username || null,
  },
  env: {
    NODE_ENV: process.env.NODE_ENV || null,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    NEXTAUTH_SECRET_len: (process.env.NEXTAUTH_SECRET || "").length,
    NEXTAUTH_SECRET_masked: maskSecret(process.env.NEXTAUTH_SECRET || ""),
    DATABASE_URL: process.env.DATABASE_URL || "file:./data/app.db",
  },
  checks: {
    nextauthUrlLooksValid: false,
    nextauthSecretStrong: false,
    dataDirWritable: false,
    sqliteOpen: false,
    sqliteSelectOk: false,
  },
  paths: {
    dataDir: path.join(process.cwd(), "data"),
    dbFile: null,
  },
  ls: {
    app: [],
    data: [],
  },
  errors: [],
};

try {
  info.checks.nextauthUrlLooksValid = /^https?:\/\//i.test(
    info.env.NEXTAUTH_URL || "",
  );
  info.checks.nextauthSecretStrong = (info.env.NEXTAUTH_SECRET_len || 0) >= 32;

  // List dirs
  try {
    info.ls.app = fs.readdirSync(process.cwd());
  } catch (e) {
    info.errors.push(["lsApp", String(e)]);
  }
  try {
    fs.mkdirSync(info.paths.dataDir, { recursive: true });
    info.ls.data = fs.readdirSync(info.paths.dataDir);
  } catch (e) {
    info.errors.push(["prepareDataDir", String(e)]);
  }

  // Write test
  try {
    const probe = path.join(info.paths.dataDir, `_diag_${Date.now()}.txt`);
    fs.writeFileSync(probe, new Date().toISOString());
    info.checks.dataDirWritable = fs.existsSync(probe);
    fs.unlinkSync(probe);
  } catch (e) {
    info.errors.push(["writeTest", String(e)]);
  }

  // DB test
  const dbAbsPath = resolveDbPath(info.env.DATABASE_URL);
  info.paths.dbFile = dbAbsPath;
  try {
    const db = new Database(dbAbsPath);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("foreign_keys = ON");
    info.checks.sqliteOpen = true;
    try {
      const row = db.prepare("SELECT 1 as ok").get();
      info.checks.sqliteSelectOk = row?.ok === 1;
    } catch (e) {
      info.errors.push(["select1", String(e)]);
    } finally {
      db.close();
    }
  } catch (e) {
    info.errors.push(["sqliteOpen", String(e)]);
  }
} catch (e) {
  info.errors.push(["fatal", String(e)]);
}

// Output JSON for easy sharing
console.log(JSON.stringify(info, null, 2));
