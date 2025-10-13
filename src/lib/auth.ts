import { randomBytes, randomUUID, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@db/index";
import { sessions, userRoles, users } from "@db/schema";
import { ensurePasswordPolicy, verifyPassword } from "@/lib/password";
import { LOGIN_ROUTE, SETUP_ROUTE } from "@/lib/routes";

export { LOGIN_ROUTE, SETUP_ROUTE } from "@/lib/routes";

export const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_MINUTES = 60 * 24 * 14; // 14 dni
const SESSION_REFRESH_THRESHOLD_MINUTES = 60 * 24 * 3; // 3 dni
const SESSION_ACTIVITY_UPDATE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minut

type DbUser = typeof users.$inferSelect;
type SessionRecord = typeof sessions.$inferSelect;
type SafeUser = Omit<DbUser, "passwordHash">;

export type AuthenticatedUser = SafeUser;

function toSafeUser(user: DbUser): SafeUser {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}

async function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
}

async function shouldUseSecureCookies() {
  try {
    const headerList = await headers();
    const forwardedProto = headerList.get("x-forwarded-proto");
    if (forwardedProto) {
      const proto = forwardedProto.split(",")[0]?.trim();
      if (proto) {
        return proto === "https";
      }
    }

    const host = headerList.get("host") ?? "";
    if (
      host.startsWith("localhost") ||
      host.startsWith("127.") ||
      host.startsWith("[::1]") ||
      host.endsWith(".local")
    ) {
      return false;
    }
  } catch (error) {
    void error;
  }

  return process.env.NODE_ENV === "production";
}

async function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: await shouldUseSecureCookies(),
    path: "/",
    expires: expiresAt,
  };
}

interface SessionInfo {
  id: string;
  user: SafeUser;
  record: SessionRecord;
}

async function findUserByUsername(username: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user ?? null;
}

export async function hasAdminUser() {
  const existingAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "ADMIN"))
    .limit(1);

  return existingAdmins.length > 0;
}

export async function createSession(user: DbUser, userAgent?: string, ipAddress?: string) {
  const token = await generateSessionToken();
  const tokenHash = await hashToken(token);
  const expiresAt = getSessionExpiryDate();
  const id = randomUUID();

  await db.insert(sessions).values({
    id,
    userId: user.id,
    tokenHash,
    userAgent,
    ipAddress,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, await getSessionCookieOptions(expiresAt));

  const now = new Date();
  await db
    .update(users)
    .set({
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  return token;
}

export async function invalidateSession(token: string) {
  const tokenHash = await hashToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function getCurrentSession(): Promise<SessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const tokenHash = await hashToken(token);
  const [sessionWithUser] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, tokenHash));

  if (!sessionWithUser) {
    // Nie możemy usuwać cookie w Server Component - middleware to zrobi
    return null;
  }

  const { session, user } = sessionWithUser;
  const now = new Date();

  if (session.expiresAt.getTime() <= now.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    // Nie możemy usuwać cookie w Server Component - middleware to zrobi
    return null;
  }

  const timeRemainingMs = session.expiresAt.getTime() - now.getTime();
  const shouldRefresh = timeRemainingMs <= SESSION_REFRESH_THRESHOLD_MINUTES * 60 * 1000;
  const shouldUpdateActivity =
    now.getTime() - session.updatedAt.getTime() >= SESSION_ACTIVITY_UPDATE_THRESHOLD_MS;

  if (shouldRefresh || shouldUpdateActivity) {
    const newExpiresAt = shouldRefresh ? getSessionExpiryDate() : session.expiresAt;

    await db
      .update(sessions)
      .set({
        updatedAt: now,
        ...(shouldRefresh ? { expiresAt: newExpiresAt } : {}),
      })
      .where(eq(sessions.id, session.id));

    if (shouldRefresh) {
      cookieStore.set(
        SESSION_COOKIE_NAME,
        token,
        await getSessionCookieOptions(newExpiresAt),
      );
      session.expiresAt = newExpiresAt;
    }

    session.updatedAt = now;
  }

  return {
    id: session.id,
    user: toSafeUser(user),
    record: session,
  };
}

export async function requireSession(options?: { redirectTo?: string }) {
  const session = await getCurrentSession();
  if (!session) {
    const target = options?.redirectTo ?? LOGIN_ROUTE;
    if (target === LOGIN_ROUTE && !(await hasAdminUser())) {
      redirect(SETUP_ROUTE);
    }
    redirect(target);
  }
  return session;
}

export async function requireRole<T extends typeof userRoles[number]>(roles: T[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role as T)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}

export async function signInWithCredentials({
  username,
  password,
  userAgent,
  ipAddress,
}: {
  username: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername || !password) {
    throw new Error("Podaj login i hasło.");
  }

  ensurePasswordPolicy(password);

  const user = await findUserByUsername(normalizedUsername);
  if (!user) {
    throw new Error("Niepoprawny login lub hasło.");
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new Error("Niepoprawny login lub hasło.");
  }

  await createSession(user, userAgent, ipAddress);

  return toSafeUser(user);
}

export async function signOutCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return;
  }

  await invalidateSession(token);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const PASSWORD_REQUIREMENTS_HINT = "Hasło musi mieć co najmniej 8 znaków.";
