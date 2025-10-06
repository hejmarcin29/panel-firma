"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { uploadClientAttachment } from "@/lib/r2";

import { Buffer } from "node:buffer";

import { type UploadClientAttachmentsState } from "./form-state";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

type UploadActionContext = {
  clientId: string;
  clientFullName?: string;
};

export async function uploadClientAttachmentsAction(
  context: UploadActionContext,
  _prevState: UploadClientAttachmentsState,
  formData: FormData,
): Promise<UploadClientAttachmentsState> {
  try {
    await requireSession();

    const clientId = context.clientId?.trim();
    if (!clientId) {
      return { status: "error", message: "Brakuje identyfikatora klienta." };
    }

    const clientFullName = context.clientFullName ?? undefined;

    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      return { status: "error", message: "Wybierz przynajmniej jeden plik do przesłania." };
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
          status: "error",
          message: `Plik ${file.name} przekracza limit 25 MB. Zmniejsz go lub podziel na mniejsze części.`,
        };
      }
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadClientAttachment({
        clientId,
        clientFullName,
        fileName: file.name,
        contentType: file.type || undefined,
        body: buffer,
        metadata: {
          "client-id": clientId,
          "original-name": file.name,
        },
      });
    }

    revalidatePath("/pliki");
    revalidatePath(`/klienci/${clientId}`);

    return {
      status: "success",
      message: files.length === 1 ? "Dodano 1 plik." : `Dodano ${files.length} pliki(-ów).`,
      uploaded: files.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Nie udało się dodać załączników." };
  }
}
