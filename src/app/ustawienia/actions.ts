"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import {
  deleteAllSessions,
  deleteExpiredSessions,
  deleteSessionById,
  deleteSessionsByUser,
} from "@/lib/sessions";
import { getEmailSettings, saveEmailSettings } from "@/lib/settings/email";
import {
  emailSettingsModes,
  emailSettingsSchema,
  type EmailSettingsInput,
  type EmailSettingsMode,
} from "@/lib/settings/schemas";

export type SessionActionResult = {
  status: "success" | "error";
  message: string;
};

const sessionIdSchema = z.object({
  sessionId: z.string().uuid("Nieprawidłowy identyfikator sesji."),
});

const userIdSchema = z.object({
  userId: z.string().uuid("Nieprawidłowy identyfikator użytkownika."),
});

function response(status: SessionActionResult["status"], message: string): SessionActionResult {
  return { status, message };
}

function handleZodError(): SessionActionResult {
  return response("error", "Nieprawidłowe dane wejściowe.");
}

type EmailFieldKey =
  | "mode"
  | "fromName"
  | "fromEmail"
  | "replyToEmail"
  | "smtpHost"
  | "smtpPort"
  | "smtpSecure"
  | "smtpUser"
  | "smtpPassword";

export type EmailSettingsFormErrors = Partial<Record<EmailFieldKey, string>>;

export type UpdateEmailSettingsFormState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message?: string; errors?: EmailSettingsFormErrors };

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

function toBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "true" || normalized === "on" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function parseMode(value: string): EmailSettingsMode {
  const normalized = value.toUpperCase();
  return emailSettingsModes.includes(normalized as EmailSettingsMode) ? (normalized as EmailSettingsMode) : "MOCK";
}

function mapEmailSettingsErrors(error: unknown): UpdateEmailSettingsFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (Array.isArray(issues)) {
      const errors: EmailSettingsFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as EmailFieldKey;
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      return { status: "error", message: "Popraw zaznaczone pola.", errors };
    }
  }

  if (error instanceof Error) {
    return { status: "error", message: error.message };
  }

  return { status: "error", message: "Nie udało się zapisać ustawień e-mail." };
}

export async function revokeSessionAction(input: { sessionId: string }): Promise<SessionActionResult> {
  const parsed = sessionIdSchema.safeParse(input);
  if (!parsed.success) {
    return handleZodError();
  }

  const session = await requireRole(["ADMIN"]);

  if (session.id === parsed.data.sessionId) {
    return response("error", "Nie możesz zakończyć swojej aktywnej sesji z tego panelu.");
  }

  const removed = await deleteSessionById(parsed.data.sessionId);

  if (removed === 0) {
    return response("error", "Sesja nie została znaleziona lub już wygasła.");
  }

  revalidatePath("/ustawienia");
  return response("success", "Sesja została zakończona.");
}

export async function revokeUserSessionsAction(input: { userId: string }): Promise<SessionActionResult> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return handleZodError();
  }

  const session = await requireRole(["ADMIN"]);

  const removed = await deleteSessionsByUser(parsed.data.userId, {
    excludeSessionId: session.id,
  });

  if (removed === 0) {
    return response("error", "Brak aktywnych sesji do zakończenia dla tego użytkownika.");
  }

  revalidatePath("/ustawienia");
  return response("success", "Sesje użytkownika zostały zakończone.");
}

export async function revokeOtherSessionsAction(): Promise<SessionActionResult> {
  const session = await requireRole(["ADMIN"]);
  const removed = await deleteAllSessions({ excludeSessionId: session.id });

  if (removed === 0) {
    return response("error", "Brak innych aktywnych sesji do zakończenia.");
  }

  revalidatePath("/ustawienia");
  return response("success", "Pozostałe sesje zostały zakończone.");
}

export async function purgeExpiredSessionsAction(): Promise<SessionActionResult> {
  await requireRole(["ADMIN"]);
  const removed = await deleteExpiredSessions();

  if (removed === 0) {
    return response("error", "Brak wygasłych sesji do usunięcia.");
  }

  revalidatePath("/ustawienia");
  return response("success", "Wygasłe sesje zostały usunięte.");
}

export async function updateEmailSettingsAction(
  _prevState: UpdateEmailSettingsFormState,
  formData: FormData,
): Promise<UpdateEmailSettingsFormState> {
  try {
    const session = await requireRole(["ADMIN"]);
    const existing = await getEmailSettings();

    const mode = parseMode(toTrimmedString(formData.get("mode")));
    const fromName = toNullableString(formData.get("fromName"));
    const fromEmail = toNullableString(formData.get("fromEmail"));
    const replyToEmail = toNullableString(formData.get("replyToEmail"));
    const smtpHost = toNullableString(formData.get("smtpHost"));
    const smtpPortRaw = toTrimmedString(formData.get("smtpPort"));

    let smtpPort: number | null = null;
    if (smtpPortRaw) {
      const parsedPort = Number(smtpPortRaw);
      if (!Number.isInteger(parsedPort)) {
        return {
          status: "error",
          message: "Port serwera SMTP musi być liczbą.",
          errors: { smtpPort: "Podaj prawidłowy port (1-65535)." },
        };
      }
      smtpPort = parsedPort;
    }

    const smtpSecure = toBoolean(formData.get("smtpSecure"));
    const smtpUser = toNullableString(formData.get("smtpUser"));
    const rawPassword = toTrimmedString(formData.get("smtpPassword"));

    let smtpPassword = existing.settings.smtpPassword;
    if (rawPassword.length > 0) {
      smtpPassword = rawPassword;
    } else if (mode === "MOCK") {
      smtpPassword = null;
    }

    const payload: EmailSettingsInput = {
      mode,
      fromName,
      fromEmail,
      replyToEmail,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
    };

    const parsed = emailSettingsSchema.parse(payload);

    await saveEmailSettings(parsed, {
      updatedById: session.user.id,
    });

    revalidatePath("/ustawienia");
    return { status: "success", message: "Ustawienia e-mail zostały zapisane." };
  } catch (error) {
    return mapEmailSettingsErrors(error);
  }
}
