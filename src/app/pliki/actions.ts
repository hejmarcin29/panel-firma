"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { ensureClientFolder } from "@/lib/r2";

import { type CreateFolderState } from "./form-state";

export async function createClientFolderAction(
  _prev: CreateFolderState,
  formData: FormData,
): Promise<CreateFolderState> {
  try {
    await requireSession();

    const clientId = formData.get("clientId");
    const clientLabel = formData.get("clientLabel");

    if (typeof clientId !== "string" || clientId.trim().length === 0) {
      return {
        status: "error",
        message: "Podaj identyfikator klienta lub folderu.",
      };
    }

    const trimmedId = clientId.trim();
    const normalizedLabel =
      typeof clientLabel === "string" && clientLabel.trim().length > 0
        ? clientLabel.trim()
        : undefined;

    await ensureClientFolder({
      clientId: trimmedId,
      clientFullName: normalizedLabel,
    });

    revalidatePath("/pliki");
    revalidatePath(`/klienci/${trimmedId}`);

    return {
      status: "success",
      message: normalizedLabel
        ? `Folder ${trimmedId} — ${normalizedLabel} jest gotowy.`
        : `Folder ${trimmedId} jest gotowy.`,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { status: "error", message: error.message };
    }
    return {
      status: "error",
      message: "Nie udało się utworzyć folderu.",
    };
  }
}
