import { randomUUID } from "node:crypto";

import { subDays } from "date-fns";
import { and, count, desc, eq, gt, ne, sql } from "drizzle-orm";

import { db } from "@db/index";
import { userRoles, users, type UserRole } from "@db/schema";
import { hashPassword } from "@/lib/password";
import { userRoleLabels } from "@/lib/user-roles";
import {
  changeUserPasswordSchema,
  createUserSchema,
  updateUserSchema,
  type ChangeUserPasswordInput,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/users/schemas";

export type UsersMetrics = {
  totalUsers: number;
  activeThisMonth: number;
  admins: number;
  installers: number;
  partners: number;
};

export type RoleBreakdownEntry = {
  role: UserRole;
  count: number;
  label: string;
};

export type UserListItem = {
  id: string;
  username: string;
  name: string | null;
  email: string;
  role: UserRole;
  phone: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export async function getUsersMetrics(): Promise<UsersMetrics> {
  const activeThreshold = subDays(new Date(), 30);

  const [totalResult, activeResult, adminsResult, installersResult, partnersResult] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(gt(users.lastLoginAt, activeThreshold)),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "ADMIN")),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "MONTER")),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "PARTNER")),
  ]);

  return {
    totalUsers: totalResult[0]?.value ?? 0,
    activeThisMonth: activeResult[0]?.value ?? 0,
    admins: adminsResult[0]?.value ?? 0,
    installers: installersResult[0]?.value ?? 0,
    partners: partnersResult[0]?.value ?? 0,
  };
}

export async function getRoleBreakdown(): Promise<RoleBreakdownEntry[]> {
  const results = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .groupBy(users.role)
    .orderBy(users.role);

  const counts = new Map<UserRole, number>();
  for (const entry of results) {
    counts.set(entry.role as UserRole, Number(entry.count ?? 0));
  }

  return userRoles.map((role) => ({
    role,
    count: counts.get(role) ?? 0,
  label: userRoleLabels[role],
  }));
}

export async function getUsersList(limit = 100): Promise<UserListItem[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    name: row.name ?? null,
    email: row.email,
    role: row.role as UserRole,
    phone: row.phone ?? null,
    lastLoginAt: row.lastLoginAt ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getUsersDashboardData(limit = 100) {
  const [metrics, roleBreakdown, list] = await Promise.all([
    getUsersMetrics(),
    getRoleBreakdown(),
    getUsersList(limit),
  ]);

  return {
    metrics,
    roleBreakdown,
    users: list,
  };
}

export type SelectUser = {
  id: string;
  label: string;
  role: UserRole;
};

export async function listUsersForSelect(options?: { role?: UserRole }): Promise<SelectUser[]> {
  const baseQuery = db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const rows = options?.role
    ? await baseQuery.where(eq(users.role, options.role))
    : await baseQuery;

  return rows.map((row) => {
    const displayName = row.name?.trim() || row.username;
    const roleLabel = userRoleLabels[row.role as keyof typeof userRoleLabels] ?? row.role;
    return {
      id: row.id,
      label: `${displayName} • ${roleLabel}`,
      role: row.role as UserRole,
    };
  });
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function normalizeNullable(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createUser(input: CreateUserInput) {
  const parsed = createUserSchema.parse(input);
  const username = normalizeIdentifier(parsed.username);
  const email = normalizeIdentifier(parsed.email);
  const name = normalizeNullable(parsed.name ?? null);
  const phone = normalizeNullable(parsed.phone ?? null);
  const passwordHash = await hashPassword(parsed.password);
  const now = new Date();

  return db.transaction((tx) => {
    const usernameConflict = tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .get();

    if (usernameConflict) {
      throw new Error("Podany login jest już zajęty.");
    }

    const emailConflict = tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .get();

    if (emailConflict) {
      throw new Error("Podany adres e-mail jest już przypisany do innego użytkownika.");
    }

    const created = tx
      .insert(users)
      .values({
        id: randomUUID(),
        username,
        email,
        passwordHash,
        role: parsed.role,
        name,
        phone,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    if (!created) {
      throw new Error("Nie udało się utworzyć użytkownika.");
    }

    return created;
  });
}

export async function updateUser(input: UpdateUserInput) {
  const parsed = updateUserSchema.parse(input);
  const username = normalizeIdentifier(parsed.username);
  const email = normalizeIdentifier(parsed.email);
  const name = normalizeNullable(parsed.name ?? null);
  const phone = normalizeNullable(parsed.phone ?? null);
  const nextRole: UserRole = parsed.role;
  const passwordHash = parsed.password && parsed.password.length > 0 ? await hashPassword(parsed.password) : null;
  const updatedAt = new Date();

  return db.transaction((tx) => {
    const existing = tx.select().from(users).where(eq(users.id, parsed.id)).limit(1).get();

    if (!existing) {
      throw new Error("Nie znaleziono użytkownika.");
    }

    const usernameConflict = tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, username), ne(users.id, parsed.id)))
      .limit(1)
      .get();

    if (usernameConflict) {
      throw new Error("Podany login jest już zajęty.");
    }

    const emailConflict = tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, parsed.id)))
      .limit(1)
      .get();

    if (emailConflict) {
      throw new Error("Podany adres e-mail jest już przypisany do innego użytkownika.");
    }

    if (existing.role === "ADMIN" && nextRole !== "ADMIN") {
      const remaining = tx
        .select({ value: count() })
        .from(users)
        .where(and(eq(users.role, "ADMIN"), ne(users.id, existing.id)))
        .limit(1)
        .get();

      const adminsLeft = Number(remaining?.value ?? 0);
      if (adminsLeft === 0) {
        throw new Error("W systemie musi pozostać przynajmniej jeden administrator.");
      }
    }

    const updatePayload: Partial<typeof users.$inferInsert> = {
      username,
      email,
      role: nextRole,
      name,
      phone,
      updatedAt,
    };

    if (passwordHash) {
      updatePayload.passwordHash = passwordHash;
    }

    const updated = tx
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, parsed.id))
      .returning()
      .get();

    if (!updated) {
      throw new Error("Nie udało się zaktualizować użytkownika.");
    }

    return updated;
  });
}

export async function changeUserPassword(input: ChangeUserPasswordInput) {
  const parsed = changeUserPasswordSchema.parse(input);
  const passwordHash = await hashPassword(parsed.password);
  const updatedAt = new Date();

  const updated = await db
    .update(users)
    .set({ passwordHash, updatedAt })
    .where(eq(users.id, parsed.userId))
    .returning()
    .get();

  if (!updated) {
    throw new Error("Nie znaleziono użytkownika.");
  }

  return updated;
}
