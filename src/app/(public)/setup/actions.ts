"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { users } from "@db/schema";

import { createSession, ensurePasswordPolicy, hashPassword } from "@/lib/auth";

import { db } from "@db";

export interface SetupState {
  error?: string | null;
}

export async function setupAction(
  _prevState: SetupState | null,
  formData: FormData,
): Promise<SetupState | null> {
  const totalUsersResult = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .limit(1);

  const totalUsers = totalUsersResult[0]?.total ?? 0;
  if (totalUsers > 0) {
    return { error: "Administrator jest już skonfigurowany. Zaloguj się." };
  }

  const nameEntry = formData.get("name");
  const emailEntry = formData.get("email");
  const passwordEntry = formData.get("password");
  const confirmEntry = formData.get("confirmPassword");

  const name = typeof nameEntry === "string" ? nameEntry.trim() : "";
  const email = typeof emailEntry === "string" ? emailEntry.trim().toLowerCase() : "";
  const password = typeof passwordEntry === "string" ? passwordEntry : "";
  const confirmPassword = typeof confirmEntry === "string" ? confirmEntry : "";

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Wypełnij wszystkie pola." };
  }

  if (password !== confirmPassword) {
    return { error: "Hasła muszą być identyczne." };
  }

  try {
    ensurePasswordPolicy(password);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Hasło nie spełnia polityki bezpieczeństwa.",
    };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Użytkownik z takim adresem e-mail już istnieje." };
  }

  const passwordHash = await hashPassword(password);

  const createdUsers = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "ADMIN",
    })
    .returning({ id: users.id });

  const createdUser = createdUsers[0];
  if (!createdUser) {
    return { error: "Nie udało się utworzyć administratora." };
  }

  await createSession(createdUser.id);

  redirect("/panel");

  return null;
}
