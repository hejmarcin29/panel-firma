import { subHours } from "date-fns";
import { and, desc, eq, gt, lte, ne } from "drizzle-orm";

import { db } from "@db/index";
import { sessions, users } from "@db/schema";
import type { UserRole } from "@/lib/user-roles";

export type SessionAdminEntry = {
  id: string;
  userId: string;
  username: string;
  name: string | null;
  role: UserRole;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  tokenPreview: string;
  isExpired: boolean;
  isRecent: boolean;
};

const DEFAULT_LIMIT = 200;

function toTokenPreview(tokenHash: string) {
  if (!tokenHash) {
    return "—";
  }
  return tokenHash.slice(0, 4).toUpperCase();
}

export async function getSessionEntries(options?: {
  includeExpired?: boolean;
  limit?: number;
}): Promise<SessionAdminEntry[]> {
  const includeExpired = options?.includeExpired ?? true;
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const now = new Date();
  const recentThreshold = subHours(now, 24);

  const baseQuery = db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      tokenHash: sessions.tokenHash,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      expiresAt: sessions.expiresAt,
      username: users.username,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .orderBy(desc(sessions.updatedAt), desc(sessions.createdAt))
    .limit(limit);

  const query = includeExpired ? baseQuery : baseQuery.where(gt(sessions.expiresAt, now));
  const rows = await query;

  return rows.map((row) => {
    const expiresAt = row.expiresAt;
    const isExpired = expiresAt.getTime() <= now.getTime();
    const lastActivity = row.updatedAt;
    const isRecent = lastActivity.getTime() >= recentThreshold.getTime();

    return {
      id: row.id,
      userId: row.userId,
      username: row.username,
      name: row.name ?? null,
      role: row.role as UserRole,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      createdAt: row.createdAt,
      updatedAt: lastActivity,
      expiresAt,
      tokenPreview: toTokenPreview(row.tokenHash),
      isExpired,
      isRecent,
    };
  });
}

export async function deleteSessionById(sessionId: string) {
  const removed = await db
    .delete(sessions)
    .where(eq(sessions.id, sessionId))
    .returning({ id: sessions.id });

  return removed.length;
}

export async function deleteSessionsByUser(userId: string, options?: { excludeSessionId?: string }) {
  const condition = options?.excludeSessionId
    ? and(eq(sessions.userId, userId), ne(sessions.id, options.excludeSessionId))
    : eq(sessions.userId, userId);

  const removed = await db
    .delete(sessions)
    .where(condition)
    .returning({ id: sessions.id });

  return removed.length;
}

export async function deleteExpiredSessions() {
  const now = new Date();
  const removed = await db
    .delete(sessions)
    .where(lte(sessions.expiresAt, now))
    .returning({ id: sessions.id });

  return removed.length;
}

export async function deleteAllSessions(options?: { excludeSessionId?: string }) {
  if (options?.excludeSessionId) {
    const removed = await db
      .delete(sessions)
      .where(ne(sessions.id, options.excludeSessionId))
      .returning({ id: sessions.id });
    return removed.length;
  }

  const removed = await db.delete(sessions).returning({ id: sessions.id });
  return removed.length;
}
