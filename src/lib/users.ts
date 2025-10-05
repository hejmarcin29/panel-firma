import { subDays } from "date-fns";
import { count, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@db/index";
import { userRoles, users, type UserRole } from "@db/schema";
import { userRoleLabels } from "@/lib/user-roles";

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
