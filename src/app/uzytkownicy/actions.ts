"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { requireRole } from "@/lib/auth";
import { createUser, updateUser } from "@/lib/users";
import { generateSecurePassword, hashPassword } from "@/lib/password";
import { db } from "@db/index";
import { users } from "@db/schema";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormErrors,
  type CreateUserFormState,
  type UpdateUserFormErrors,
  type UpdateUserFormState,
} from "@/lib/users/schemas";

function toTrimmedString(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function toNullableString(value: FormDataEntryValue | null): string | null {
  const trimmed = toTrimmedString(value);
  return trimmed.length > 0 ? trimmed : null;
}

function mapCreateErrors(error: unknown): CreateUserFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (Array.isArray(issues)) {
      const errors: CreateUserFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as keyof CreateUserFormErrors;
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      return { status: "error", message: "Popraw zaznaczone pola.", errors };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("login")) {
      return {
        status: "error",
        message: error.message,
        errors: { username: error.message },
      };
    }

    if (error.message.includes("e-mail") || error.message.includes("adres")) {
      return {
        status: "error",
        message: error.message,
        errors: { email: error.message },
      };
    }

    if (error.message.includes("Hasło")) {
      return {
        status: "error",
        message: error.message,
        errors: { password: error.message },
      };
    }

    return { status: "error", message: error.message };
  }

  return { status: "error", message: "Nie udało się utworzyć użytkownika." };
}

function mapUpdateErrors(error: unknown): UpdateUserFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (Array.isArray(issues)) {
      const errors: UpdateUserFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as keyof UpdateUserFormErrors;
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      return { status: "error", message: "Popraw zaznaczone pola.", errors };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("login")) {
      return {
        status: "error",
        message: error.message,
        errors: { username: error.message },
      };
    }

    if (error.message.includes("e-mail") || error.message.includes("adres")) {
      return {
        status: "error",
        message: error.message,
        errors: { email: error.message },
      };
    }

    if (error.message.includes("administrator")) {
      return {
        status: "error",
        message: error.message,
        errors: { role: error.message },
      };
    }

    if (error.message.includes("Hasło")) {
      return {
        status: "error",
        message: error.message,
        errors: { password: error.message },
      };
    }

    return { status: "error", message: error.message };
  }

  return { status: "error", message: "Nie udało się zaktualizować użytkownika." };
}

export async function createUserAction(
  _prevState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  try {
    await requireRole(["ADMIN"]);

    const payload = {
      username: toTrimmedString(formData.get("username")),
      email: toTrimmedString(formData.get("email")),
      name: toNullableString(formData.get("name")),
      phone: toNullableString(formData.get("phone")),
      role: toTrimmedString(formData.get("role")).toUpperCase(),
      password: toTrimmedString(formData.get("password")),
    };

    const confirmPassword = toTrimmedString(formData.get("confirmPassword"));

    if (!payload.password) {
      return {
        status: "error",
        message: "Hasło jest wymagane.",
        errors: {
          password: "Podaj hasło.",
        },
      };
    }

    if (!payload.role) {
      return {
        status: "error",
        message: "Wybierz rolę użytkownika.",
        errors: {
          role: "Wybierz rolę.",
        },
      };
    }

    if (payload.password !== confirmPassword) {
      return {
        status: "error",
        message: "Hasła nie są identyczne.",
        errors: {
          password: "Hasła nie są identyczne.",
          confirmPassword: "Hasła nie są identyczne.",
        },
      };
    }

    const parsed = createUserSchema.parse(payload);

    await createUser(parsed);

    revalidatePath("/uzytkownicy");
  } catch (error) {
    return mapCreateErrors(error);
  }

  return { status: "success", message: "Użytkownik został utworzony." };
}

export async function updateUserAction(
  _prevState: UpdateUserFormState,
  formData: FormData,
): Promise<UpdateUserFormState> {
  try {
    await requireRole(["ADMIN"]);

    const rawPassword = toTrimmedString(formData.get("password"));
    const confirmPassword = toTrimmedString(formData.get("confirmPassword"));

    if (rawPassword || confirmPassword) {
      if (!rawPassword || !confirmPassword) {
        return {
          status: "error",
          message: "Uzupełnij oba pola hasła.",
          errors: {
            password: "Podaj hasło.",
            confirmPassword: "Potwierdź hasło.",
          },
        };
      }

      if (rawPassword !== confirmPassword) {
        return {
          status: "error",
          message: "Hasła nie są identyczne.",
          errors: {
            password: "Hasła nie są identyczne.",
            confirmPassword: "Hasła nie są identyczne.",
          },
        };
      }
    }

    const payload = {
      id: toTrimmedString(formData.get("userId")),
      username: toTrimmedString(formData.get("username")),
      email: toTrimmedString(formData.get("email")),
      name: toNullableString(formData.get("name")),
      phone: toNullableString(formData.get("phone")),
      role: toTrimmedString(formData.get("role")).toUpperCase(),
      password: rawPassword ? rawPassword : null,
    };

    const parsed = updateUserSchema.parse(payload);

    await updateUser(parsed);

    revalidatePath("/uzytkownicy");
  } catch (error) {
    return mapUpdateErrors(error);
  }

  return { status: "success", message: "Zmiany zostały zapisane." };
}

interface ResetPasswordState {
  status: 'idle' | 'pending' | 'success' | 'error'
  message?: string
  newPassword?: string
}

export async function resetUserPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  try {
    await requireRole(["ADMIN"]);

    const userId = toTrimmedString(formData.get("userId"));
    
    if (!userId) {
      return {
        status: "error",
        message: "Nie podano ID użytkownika.",
      };
    }

    // Wygeneruj nowe hasło
    const newPassword = generateSecurePassword();
    const passwordHash = await hashPassword(newPassword);

    // Zaktualizuj hasło w bazie
    const now = new Date();
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    revalidatePath("/uzytkownicy");

    return {
      status: "success",
      message: "Nowe hasło zostało wygenerowane.",
      newPassword,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "error",
      message: "Nie udało się zresetować hasła.",
    };
  }
}
