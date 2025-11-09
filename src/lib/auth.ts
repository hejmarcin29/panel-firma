import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


import { sessions, users, type UserRole, userRoles } from "@db/schema";

import { db } from "@db";

const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function ensurePasswordPolicy(password: string) {
  const hasLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasLength || !hasDigit || !hasLetter) {
    throw new Error("Hasło musi mieć min. 8 znaków i zawierać litery oraz cyfry.");
  }
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt: new Date(expiresAt),
  });

  await setSessionCookie(token, expiresAt);

  return token;
}

export async function destroySession() {
  const token = await getSessionCookie();
  if (!token) {
    return;
  }

  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  await clearSessionCookie();
}

export async function getCurrentSession() {
  const token = await getSessionCookie();
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const [sessionRecord] = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!sessionRecord) {
    return null;
  }

  if (sessionRecord.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionRecord.id));
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, sessionRecord.userId))
    .limit(1);

  if (!user) {
    await db.delete(sessions).where(eq(sessions.id, sessionRecord.id));
    return null;
  }

  return {
    session: sessionRecord,
    user,
  };
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/logowanie");
  }
  return session;
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const session = await requireSession();

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/panel");
  }

  return session.user;
}

export function isRole(value: string): value is UserRole {
  return (userRoles as readonly string[]).includes(value);
}

export async function setSessionCookie(token: string, expiresAt: number) {
  const cookieStore = await cookies();
  try {
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Nie udało się ustawić cookie sesji poza akcją serwerową.", error);
    }
  }
}

async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  try {
    cookieStore.delete(SESSION_COOKIE);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Nie udało się wyczyścić cookie sesji poza akcją serwerową.", error);
    }
  }
}
