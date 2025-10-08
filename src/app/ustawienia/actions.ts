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
