#!/usr/bin/env node
/**
 * Basic migration integrity checks (stage 1):
 * 1. Duplicate numeric prefixes (e.g. two files starting with 0005_)
 * 2. Gaps in sequence (non‑continuous numbering) – advisory (warn) unless gap explained by missing commit
 * 3. Unapplied migration files (present in drizzle/ but missing from journal after running migrate)
 * 4. schema.ts changed (since main) but no new migration file added
 *
 * Exits with non‑zero on hard errors:
 *  - duplicate prefix
 *  - unapplied migration (unless its number <= last applied — which would be ignored anyway)
 *  - schema change without new migration
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const drizzleDir = path.join(root, "drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");
const schemaPath = path.join(root, "src", "db", "schema.ts");

function fail(msg) {
  console.error(`\x1b[31m[check-migrations] ERROR:\x1b[0m ${msg}`);
  process.exit(1);
}
function warn(msg) {
  console.warn(`\x1b[33m[check-migrations] WARN:\x1b[0m ${msg}`);
}

if (!fs.existsSync(drizzleDir)) fail("Directory drizzle/ not found");
if (!fs.existsSync(journalPath))
  fail("Journal file missing: drizzle/meta/_journal.json");
if (!fs.existsSync(schemaPath)) fail("schema.ts not found");

// Load journal
let journal;
try {
  journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
} catch {
  fail("Cannot parse _journal.json");
}
const appliedTags = new Set(journal.entries.map((e) => e.tag));
const appliedNumbers = new Set(
  Array.from(appliedTags).map((t) => t.split("_")[0]),
);
const lastAppliedNumber = Math.max(
  ...Array.from(appliedNumbers).map((n) => parseInt(n, 10)),
);

// Scan migration files
const files = fs.readdirSync(drizzleDir).filter((f) => /\.sql$/.test(f));
if (!files.length) fail("No .sql migration files found");

const entries = files
  .map((f) => {
    const match = f.match(/^(\d{4})_/);
    if (!match) return null; // ignore malformed (warn?)
    return { file: f, numberStr: match[1], number: parseInt(match[1], 10) };
  })
  .filter(Boolean);

// 1. Duplicate numeric prefixes
const mapByNumber = new Map();
for (const e of entries) {
  if (!mapByNumber.has(e.numberStr)) mapByNumber.set(e.numberStr, []);
  mapByNumber.get(e.numberStr).push(e.file);
}
for (const [num, arr] of mapByNumber.entries()) {
  if (arr.length > 1) {
    fail(`Duplicate migration number ${num} in files: ${arr.join(", ")}`);
  }
}

// 2. Gaps in sequence
const sorted = entries.map((e) => e.number).sort((a, b) => a - b);
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i] !== sorted[i - 1] + 1) {
    warn(
      `Gap detected between ${sorted[i - 1].toString().padStart(4, "0")} and ${sorted[i].toString().padStart(4, "0")}. Ensure missing numbers are not uncommitted.`,
    );
  }
}

// 3. Unapplied migration files
const unapplied = entries.filter((e) => !appliedNumbers.has(e.numberStr));
if (unapplied.length) {
  // If number greater than lastAppliedNumber => migration likely not migrated locally
  const blocking = unapplied.filter((e) => e.number > lastAppliedNumber);
  if (blocking.length) {
    const list = blocking.map((b) => b.file).join(", ");
    fail(`Unapplied migration(s): ${list}. Run: npx drizzle-kit migrate`);
  } else {
    // Numbers <= lastApplied but missing tag means journal mismatch (e.g. duplicate attempt) – warn
    warn(
      `Found file(s) with numbers <= last applied but missing in journal (ignored by Drizzle): ${unapplied.map((u) => u.file).join(", ")}`,
    );
  }
}

// 4. schema.ts changed but no new migration
let schemaChanged = false;
try {
  // Compare against origin/main if exists, otherwise last commit
  let baseRef = "origin/main";
  try {
    execSync("git rev-parse --verify origin/main", { stdio: "ignore" });
  } catch {
    baseRef = "HEAD~1";
  }
  const diffStat = execSync(
    `git --no-pager diff --name-only ${baseRef} -- ${schemaPath}`,
  )
    .toString()
    .trim();
  if (diffStat) schemaChanged = true;
} catch {}

if (schemaChanged) {
  // Check if a new (greater) number exists beyond lastAppliedNumber from baseRef
  // Heuristic: if last file number > lastAppliedNumber and not applied yet, we already failed earlier.
  // Otherwise, ensure at least one migration file changed in diff.
  let migrationsDiff = "";
  try {
    let baseRef = "origin/main";
    try {
      execSync("git rev-parse --verify origin/main", { stdio: "ignore" });
    } catch {
      baseRef = "HEAD~1";
    }
    migrationsDiff = execSync(
      `git --no-pager diff --name-only ${baseRef} -- drizzle/`,
    ).toString();
  } catch {}
  if (!/\.sql/.test(migrationsDiff)) {
    fail(
      "schema.ts changed but no new migration (.sql) detected. Run: npx drizzle-kit generate; npx drizzle-kit migrate",
    );
  }
}

console.log("\x1b[32m[check-migrations] OK\x1b[0m");
