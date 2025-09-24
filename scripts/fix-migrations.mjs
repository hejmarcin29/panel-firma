#!/usr/bin/env node
/**
 * Auto-fix for duplicate-numbered Drizzle migrations in drizzle/.
 * - If multiple files share the same numeric prefix (e.g., 0003_*),
 *   keep the one present in the journal (meta/_journal.json) and move the others to drizzle/ignored/.
 * - If none of the duplicates are present in the journal (rare), keep the lexicographically first and move the rest.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const drizzleDir = path.join(root, 'drizzle');
const journalPath = path.join(drizzleDir, 'meta', '_journal.json');
const ignoredDir = path.join(drizzleDir, 'ignored');

function info(msg){ console.log(`\x1b[36m[fix-migrations]\x1b[0m ${msg}`); }
function warn(msg){ console.warn(`\x1b[33m[fix-migrations] WARN:\x1b[0m ${msg}`); }
function fail(msg){ console.error(`\x1b[31m[fix-migrations] ERROR:\x1b[0m ${msg}`); process.exit(1); }

if (!fs.existsSync(drizzleDir)) fail('Directory drizzle/ not found');
if (!fs.existsSync(journalPath)) fail('Journal file missing: drizzle/meta/_journal.json');

let journal;
try { journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')); } catch { fail('Cannot parse _journal.json'); }
const appliedTags = new Set(journal.entries.map(e => e.tag));
const appliedByNumber = new Map();
for (const tag of appliedTags) {
  const num = tag.split('_')[0];
  appliedByNumber.set(num, tag);
}

const files = fs.readdirSync(drizzleDir).filter(f => /\.sql$/.test(f));
const byNumber = new Map();
for (const f of files) {
  const m = f.match(/^(\d{4})_/);
  if (!m) continue;
  const num = m[1];
  if (!byNumber.has(num)) byNumber.set(num, []);
  byNumber.get(num).push(f);
}

let moved = 0;
for (const [num, arr] of byNumber) {
  if (arr.length <= 1) continue;
  const journalTag = appliedByNumber.get(num) || null;
  let keep = null;
  if (journalTag) {
    // prefer the file whose basename starts with the journal tag
    keep = arr.find(f => f.startsWith(journalTag + '.sql')) || arr[0];
  } else {
    // none is in journal yet: keep lexicographically first
    keep = arr.slice().sort()[0];
    warn(`No journal entry for ${num}. Keeping ${keep}, moving others.`);
  }
  const moveThese = arr.filter(f => f !== keep);
  if (!moveThese.length) continue;
  if (!fs.existsSync(ignoredDir)) fs.mkdirSync(ignoredDir, { recursive: true });
  for (const f of moveThese) {
    const src = path.join(drizzleDir, f);
    const dst = path.join(ignoredDir, f);
    fs.renameSync(src, dst);
    moved++;
    info(`Moved duplicate ${f} -> ignored/${f} (kept ${keep})`);
  }
}

if (moved === 0) {
  info('No duplicates found or already fixed.');
} else {
  info(`Completed. Moved ${moved} duplicate file(s) to drizzle/ignored/`);
}
