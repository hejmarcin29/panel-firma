"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { users } from "@db/schema";

import { createSession, verifyPassword } from "@/lib/auth";

import { db } from "@db";

export interface LoginState {
  error?: string | null;
}

export async function loginAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState | null> {
  const emailEntry = formData.get("email");
  const passwordEntry = formData.get("password");

  const email = typeof emailEntry === "string" ? emailEntry.trim().toLowerCase() : "";
  const password = typeof passwordEntry === "string" ? passwordEntry : "";

  if (!email || !password) {
    return { error: "Podaj e-mail i hasło." };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return { error: "Nieprawidłowe dane logowania." };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Nieprawidłowe dane logowania." };
  }

  await createSession(user.id);

  redirect("/panel");

  return null;
}
