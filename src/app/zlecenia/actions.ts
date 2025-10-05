"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireRole } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { createOrderSchema, type CreateOrderFormErrors, type CreateOrderFormState } from "@/lib/orders/schemas";

const NUMBER_FIELD_NAMES = new Set(["declaredFloorArea", "declaredBaseboardLength"]);

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

function toNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }
  return parsed;
}

function mapZodErrors(error: unknown): CreateOrderFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (issues && Array.isArray(issues)) {
      const errors: CreateOrderFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") {
          continue;
        }
        const key = fieldKey as keyof CreateOrderFormErrors;
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

  return { status: "error", message: "Nie udało się wysłać formularza." };
}

const CHECKBOX_FIELDS = [
  "requiresAdminAttention",
  "quoteSent",
  "depositInvoiceIssued",
  "finalInvoiceIssued",
] as const;

type CheckboxField = (typeof CHECKBOX_FIELDS)[number];

export async function createOrderAction(
  _prevState: CreateOrderFormState,
  formData: FormData,
): Promise<CreateOrderFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const payload: Record<string, unknown> = {};

    for (const [name, value] of formData.entries()) {
      if (CHECKBOX_FIELDS.includes(name as CheckboxField)) {
        payload[name] = toBoolean(value);
        continue;
      }

      if (NUMBER_FIELD_NAMES.has(name)) {
        payload[name] = toNumber(value);
        continue;
      }

      if (name === "stage") {
        payload[name] = typeof value === "string" ? value : undefined;
        continue;
      }

      payload[name] = toNullableString(value);
    }

    for (const field of CHECKBOX_FIELDS) {
      if (!(field in payload)) {
        payload[field] = false;
      }
    }

    if (!payload.clientId) {
      payload.clientId = toNullableString(formData.get("clientId"));
    }

    const parsed = createOrderSchema.parse(payload);

    const order = await createOrder(parsed, session.user.id);

    revalidatePath("/zlecenia");
    redirect(`/zlecenia/${order.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapZodErrors(error);
  }

  return { status: "idle" };
}