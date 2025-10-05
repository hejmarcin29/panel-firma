"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/clients";
import {
  createClientSchema,
  type CreateClientFormErrors,
  type CreateClientFormState,
  type CreateClientInput,
} from "@/lib/clients/schemas";

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapZodErrors(error: unknown): CreateClientFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (issues && Array.isArray(issues)) {
      const errors: CreateClientFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as keyof CreateClientFormErrors;
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

  return { status: "error", message: "Nie udało się zapisać klienta." };
}

export async function createClientAction(
  _prevState: CreateClientFormState,
  formData: FormData,
): Promise<CreateClientFormState> {
  try {
    await requireRole(["ADMIN"]);

    const payload = {
      fullName: toNullableString(formData.get("fullName")) ?? "",
      partnerId: toNullableString(formData.get("partnerId")),
      email: toNullableString(formData.get("email")),
      phone: toNullableString(formData.get("phone")),
      city: toNullableString(formData.get("city")),
      street: toNullableString(formData.get("street")),
      postalCode: toNullableString(formData.get("postalCode")),
      acquisitionSource: toNullableString(formData.get("acquisitionSource")),
      additionalInfo: toNullableString(formData.get("additionalInfo")),
    };

    const parsed = createClientSchema.parse(payload);

    const normalized: CreateClientInput = {
      ...parsed,
      partnerId: parsed.acquisitionSource === "partner" ? parsed.partnerId ?? null : null,
    };

    const client = await createClient(normalized);

    revalidatePath("/klienci");
    redirect(`/klienci/${client.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapZodErrors(error);
  }

  return { status: "idle" };
}
