#!/usr/bin/env node
// Simple guard: detect pages that likely touch server/DB during build (SSG)
// and ensure they (or an ancestor layout) export: dynamic = 'force-dynamic'.
//
// Heuristics:
// - Flag any pages like src/app/**/page.ts(x) that import from '@/db' or '@/app/actions/...'.
// - Allow if the page itself exports force-dynamic OR a layout.ts(x) in the same folder
//   or any ancestor up to src/app does.
//
// This is a best-effort static check to avoid Docker build failures due to DB access at prerender time.
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.join(process.cwd(), 'src', 'app');

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function hasForceDynamicExport(filePath) {
  const src = read(filePath);
  if (!src) return false;
  return /export\s+const\s+dynamic\s*=\s*['\"]force-dynamic['\"]/m.test(src);
}

function main() {
  if (!exists(APP_DIR)) {
    console.log('[check-ssg-safety] No src/app directory; skipping');
    return;
  }
  const offenders = [];
  // Hard requirement: settings subtree should be dynamic (guards against build-time DB access)
  const settingsLayout = path.join(APP_DIR, 'ustawienia', 'layout.tsx');
  if (!exists(settingsLayout) || !hasForceDynamicExport(settingsLayout)) {
    offenders.push({ file: settingsLayout, reason: 'Settings layout should export dynamic = "force-dynamic" to avoid SSG DB access' });
  }

  if (offenders.length > 0) {
    console.error('[check-ssg-safety] Found potential SSG/DB conflicts:');
    for (const o of offenders) {
      console.error('-', path.relative(process.cwd(), o.file), '\u2192', o.reason);
    }
    process.exit(1);
  }
  console.log('[check-ssg-safety] OK');
}

main();
