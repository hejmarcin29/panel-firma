import bcrypt from "bcryptjs";

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
