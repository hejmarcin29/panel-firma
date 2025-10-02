#!/usr/bin/env node
/*
 Simple guard: detect pages that likely touch server/DB during build (SSG)
 and ensure they (or an ancestor layout) export `export const dynamic = 'force-dynamic'`.

 Heuristics:
 - Flag any src/app/**/page.ts(x) importing from '@/db' or '@/app/actions/*'.
 - Allow if the page itself exports dynamic force-dynamic OR a layout.ts(x) in the same folder or any ancestor up to src/app does.

 This is a best-effort static check to avoid Docker build failures due to DB access at prerender time.
*/
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

function ancestorHasDynamic(dir) {
  let cur = dir;
  while (cur.startsWith(APP_DIR)) {
    const layoutTsx = path.join(cur, 'layout.tsx');
    const layoutTs = path.join(cur, 'layout.ts');
    if (exists(layoutTsx) && hasForceDynamicExport(layoutTsx)) return true;
    if (exists(layoutTs) && hasForceDynamicExport(layoutTs)) return true;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
    // stop at src/app
    if (cur === path.dirname(APP_DIR)) break;
  }
  return false;
}

function usesServerDb(code) {
  if (!code) return false;
  const re = /(from\s+['\"]@\/db['\"])|(from\s+['\"]@\/app\/actions[^'\"]*['\"])|(getProjectSettings\s*\()/;
  return re.test(code);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (entry.isFile()) files.push(p);
  }
  return files;
}

function main() {
  if (!exists(APP_DIR)) {
    console.log('[check-ssg-safety] No src/app directory; skipping');
    return;
  }
  const files = walk(APP_DIR).filter((p) => /[\\\/]page\.(t|j)sx?$/.test(p));
  const offenders = [];
  for (const file of files) {
    const code = read(file);
    if (!usesServerDb(code)) continue;
    const dir = path.dirname(file);
    const ok = hasForceDynamicExport(file) || ancestorHasDynamic(dir);
    if (!ok) {
      offenders.push({ file, reason: 'Imports server/DB modules but no dynamic="force-dynamic" on page or ancestor layout' });
    }
  }

  // Hard requirement: settings subtree should be dynamic
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
