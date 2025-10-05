"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@db/index";
import { users } from "@db/schema";
import { hasAdminUser, createSession, LOGIN_ROUTE } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export type SetupFormState = {
  status: "idle" | "error";
  message?: string;
};

const ADMIN_ROLE = "ADMIN" as const;

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerInitialAdmin(
  _prevState: SetupFormState,
  formData: FormData,
): Promise<SetupFormState> {
  if (await hasAdminUser()) {
    redirect(LOGIN_ROUTE);
  }

  const fullName = getStringField(formData, "name");
  const emailRaw = getStringField(formData, "email");
  const usernameRaw = getStringField(formData, "username");
  const password = getStringField(formData, "password");
  const confirmPassword = getStringField(formData, "confirmPassword");

  if (!emailRaw) {
    return {
      status: "error",
      message: "Podaj adres e-mail.",
    };
  }

  if (!usernameRaw) {
    return {
      status: "error",
      message: "Podaj login użytkownika.",
    };
  }

  if (!password || !confirmPassword) {
    return {
      status: "error",
      message: "Hasło i potwierdzenie są wymagane.",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Hasła nie są identyczne.",
    };
  }

  const email = emailRaw.toLowerCase();
  const username = usernameRaw.toLowerCase();

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsername) {
    return {
      status: "error",
      message: "Podany login jest już zajęty.",
    };
  }

  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingEmail) {
    return {
      status: "error",
      message: "Podany adres e-mail jest już przypisany do innego użytkownika.",
    };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      username,
      email,
      passwordHash,
      role: ADMIN_ROLE,
      name: fullName || null,
    })
    .returning();

  if (!newUser) {
    return {
      status: "error",
      message: "Nie udało się utworzyć konta administratora.",
    };
  }

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? undefined;
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

  await createSession(newUser, userAgent, ipAddress);

  redirect("/zlecenia");
}
