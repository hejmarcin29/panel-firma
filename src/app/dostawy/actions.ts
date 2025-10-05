"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth";
import { createDelivery } from "@/lib/deliveries";
import {
  createDeliverySchema,
  type CreateDeliveryFormErrors,
  type CreateDeliveryFormState,
} from "@/lib/deliveries/schemas";

const CHECKBOX_FIELDS = [
  "includePanels",
  "includeBaseboards",
  "proformaIssued",
  "depositOrFinalInvoiceIssued",
  "shippingOrdered",
  "reviewReceived",
  "requiresAdminAttention",
] as const;

type CheckboxField = (typeof CHECKBOX_FIELDS)[number];

const DATE_FIELDS = ["scheduledDate"] as const;
type DateField = (typeof DATE_FIELDS)[number];

const STRING_FIELDS = ["type", "clientId", "stage"] as const;
type StringField = (typeof STRING_FIELDS)[number];

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRequiredString(value: FormDataEntryValue | null): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
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

function mapZodErrors(error: unknown): CreateDeliveryFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (issues && Array.isArray(issues)) {
      const errors: CreateDeliveryFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as keyof CreateDeliveryFormErrors;
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

export async function createDeliveryAction(
  _prevState: CreateDeliveryFormState,
  formData: FormData,
): Promise<CreateDeliveryFormState> {
  try {
    const session = await requireRole(["ADMIN"]);

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

      if (STRING_FIELDS.includes(name as StringField)) {
        payload[name] = toRequiredString(value);
        continue;
      }

      payload[name] = toNullableString(value);
    }

    for (const field of CHECKBOX_FIELDS) {
      if (!(field in payload)) {
        payload[field] = false;
      }
    }

    const parsed = createDeliverySchema.parse(payload);

    await createDelivery(parsed, session.user.id);

    revalidatePath("/dostawy");
    redirect("/dostawy");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapZodErrors(error);
  }

  return { status: "idle" };
}
