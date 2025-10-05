"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth";
import { createInstallation } from "@/lib/installations";
import { ensureOrderForClient } from "@/lib/orders";
import {
  createInstallationSchema,
  type CreateInstallationFormErrors,
  type CreateInstallationFormState,
} from "@/lib/installations/schemas";

const CHECKBOX_FIELDS = [
  "handoverProtocolSigned",
  "reviewReceived",
  "requiresAdminAttention",
] as const;

type CheckboxField = (typeof CHECKBOX_FIELDS)[number];

const DATE_FIELDS = [
  "scheduledStartAt",
  "scheduledEndAt",
  "actualStartAt",
  "actualEndAt",
] as const;

type DateField = (typeof DATE_FIELDS)[number];

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value === "string") {
    return value === "on" || value === "true";
  }
  return false;
}

function toDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function mapZodErrors(error: unknown): CreateInstallationFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (issues && Array.isArray(issues)) {
      const errors: CreateInstallationFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as keyof CreateInstallationFormErrors;
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

  return { status: "error", message: "Nie udało się zapisać formularza." };
}

export async function createInstallationAction(
  _prevState: CreateInstallationFormState,
  formData: FormData,
): Promise<CreateInstallationFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const payload: Record<string, unknown> = {};

    for (const [name, value] of formData.entries()) {
      if (CHECKBOX_FIELDS.includes(name as CheckboxField)) {
        payload[name] = toBoolean(value);
        continue;
      }

      if (DATE_FIELDS.includes(name as DateField)) {
        payload[name] = toDate(value);
        continue;
      }

      payload[name] = toNullableString(value);
    }

    for (const field of CHECKBOX_FIELDS) {
      if (!(field in payload)) {
        payload[field] = false;
      }
    }

    payload.orderId = toNullableString(formData.get("orderId"));
    payload.clientId = toNullableString(formData.get("clientId"));

    const parsed = createInstallationSchema.parse(payload);

    let orderId = parsed.orderId;

    if (!orderId) {
      if (!parsed.clientId) {
        return {
          status: "error",
          message: "Wybierz klienta, aby zaplanować montaż.",
          errors: { clientId: "Wybierz klienta." },
        };
      }

      const ensuredOrder = await ensureOrderForClient({
        clientId: parsed.clientId,
        createdById: session.user.id,
      });

      orderId = ensuredOrder.id;
    }

    const installationInput = {
      ...parsed,
      orderId,
    };

    const installation = await createInstallation(installationInput, session.user.id);

    revalidatePath("/montaze");
    redirect(`/zlecenia/${installation.orderId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapZodErrors(error);
  }

  return { status: "idle" };
}
