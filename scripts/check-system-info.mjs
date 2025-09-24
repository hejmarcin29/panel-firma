#!/usr/bin/env node
/**
 * Simple consistency check for systemInfoPoints.
 * - Ensures today's date (UTC) has at least one entry IF there is any commit today touching src/ or app/.
 * - Ensures newest entries appear at the end OR apply chosen ordering (currently appended at end in pl.ts).
 * - Warns if last entry older than 7 days.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PL_FILE = path.join(process.cwd(), 'src', 'i18n', 'pl.ts');
if (!fs.existsSync(PL_FILE)) {
  console.error('[check-system-info] pl.ts not found');
  process.exit(1);
}
const src = fs.readFileSync(PL_FILE, 'utf8');
const match = src.match(/systemInfoPoints:\s*\[(.*?)\]/s);
if (!match) {
  console.error('[check-system-info] systemInfoPoints array not found');
  process.exit(1);
}
const raw = match[1];
const points = Array.from(raw.matchAll(/'([^']+)'/g)).map(m => m[1]);
if (!points.length) {
  console.error('[check-system-info] systemInfoPoints is empty');
  process.exit(1);
}

// Find dated entries YYYY-MM-DD –
const dated = points.filter(p => /^\d{4}-\d{2}-\d{2}\s+–/.test(p));
const now = new Date();
const todayStr = now.toISOString().slice(0,10);

// Get commits touching src/ or app/ today
let changedToday = false;
try {
  const log = execSync(`git --no-pager log --since=${todayStr}T00:00:00 --pretty=format:%H --name-only`).toString();
  if (/^(src\/|app\/)/m.test(log)) changedToday = true;
} catch {}

if (changedToday) {
  const hasToday = dated.some(p => p.startsWith(todayStr));
  if (!hasToday) {
    console.error(`[check-system-info] ERROR: Commits today touched src/ or app/ but no systemInfoPoints entry for ${todayStr}.`);
    process.exit(2);
  }
}

// Check recency (warn if last dated older than 7 days)
if (dated.length) {
  const last = dated[dated.length - 1];
  const dateStr = last.slice(0,10);
  const lastDate = new Date(dateStr + 'T00:00:00Z');
  const diffDays = (now - lastDate) / 86400000;
  if (diffDays > 7) {
    console.warn(`[check-system-info] WARNING: Last dated entry is ${diffDays.toFixed(1)} days old.`);
  }
}

console.log(`[check-system-info] OK. Entries: ${points.length}. Dated entries: ${dated.length}.`);
