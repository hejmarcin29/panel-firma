'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/session';

import { constants as fsConstants } from 'fs';
import { access, readFile, writeFile } from 'fs/promises';
import path from 'path';

const ENV_LOCAL_FILE = path.join(process.cwd(), '.env.local');
const SECRET_KEY = 'WOOCOMMERCE_WEBHOOK_SECRET';

async function ensureEnvFile(): Promise<string> {
  try {
    await access(ENV_LOCAL_FILE, fsConstants.F_OK);
    return await readFile(ENV_LOCAL_FILE, 'utf8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return '';
    }

    throw new Error('Nie mozna odczytac pliku .env.local.');
  }
}

async function writeEnvFile(content: string) {
  try {
    await writeFile(ENV_LOCAL_FILE, content, 'utf8');
  } catch {
    throw new Error('Nie udalo sie zapisac pliku .env.local.');
  }
}

function updateEnvContent(original: string, key: string, value: string) {
  const lines = original.length ? original.split(/\r?\n/) : [];
  const pattern = new RegExp(`^${key}\\s*=`);
  let replaced = false;

  const updated = lines.map((line) => {
    if (pattern.test(line)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!replaced) {
    if (updated.length > 0 && updated[updated.length - 1].trim().length > 0) {
      updated.push('');
    }
    updated.push(`${key}=${value}`);
  }

  return updated.join('\n').replace(/\n*$/, '\n');
}

export async function updateWooWebhookSecret(secret: string) {
  const user = await requireUser();
  if (user.role !== 'owner') {
    throw new Error('Tylko wlasciciel moze zmieniac konfiguracje integracji.');
  }

  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error('Sekret nie moze byc pusty.');
  }

  if (trimmed.length < 16) {
    throw new Error('Sekret powinien miec co najmniej 16 znakow.');
  }

  const content = await ensureEnvFile();
  const nextContent = updateEnvContent(content, SECRET_KEY, trimmed);

  await writeEnvFile(nextContent);

  process.env[SECRET_KEY] = trimmed;
  revalidatePath('/dashboard/settings');
}

