import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordLongEnough(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function ensurePasswordPolicy(password: string) {
  if (!isPasswordLongEnough(password)) {
    throw new Error(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`);
  }
}

export async function hashPassword(password: string) {
  ensurePasswordPolicy(password);
  const saltRounds = 12;

  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Generuje bezpieczne, losowe hasło
 * Format: 4 grupy po 4 znaki alfanumeryczne oddzielone myślnikami
 * Przykład: Kb3d-9Xm2-7Pq5-Rn8w
 */
export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const groups = 4;
  const groupLength = 4;
  
  const result: string[] = [];
  
  for (let i = 0; i < groups; i++) {
    const bytes = randomBytes(groupLength);
    let group = '';
    
    for (let j = 0; j < groupLength; j++) {
      const index = bytes[j]! % chars.length;
      group += chars[index];
    }
    
    result.push(group);
  }
  
  return result.join('-');
}
