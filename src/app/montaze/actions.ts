"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { eq } from "drizzle-orm";

import { db } from "@db/index";
import { installations, type DeliveryTimingType } from "@db/schema";

import { requireRole } from "@/lib/auth";
import { createDelivery } from "@/lib/deliveries";
import { createInstallation, updateInstallation } from "@/lib/installations";
import { ensureOrderForClient } from "@/lib/orders";
import {
  createInstallationSchema,
  updateInstallationSchema,
  type CreateInstallationFormErrors,
  type CreateInstallationFormState,
} from "@/lib/installations/schemas";
import {
  createDeliverySchema,
  type CreateDeliveryFormErrors,
  type CreateDeliveryFormState,
} from "@/lib/deliveries/schemas";
import { createMeasurement } from "@/lib/measurements";
import {
  createMeasurementSchema,
  type CreateMeasurementInput,
} from "@/lib/measurements/schemas";

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

const MEASUREMENT_FIELDS = [
  "scheduleMeasurement",
  "measurementScheduledAt",
  "measurementMeasuredById",
  "measurementDeliveryTimingType",
  "measurementDeliveryDaysBefore",
  "measurementDeliveryDate",
  "measurementAdditionalNotes",
] as const;

const MEASUREMENT_FIELD_SET = new Set<string>(MEASUREMENT_FIELDS);

const measurementErrorFieldMap: Record<string, keyof CreateInstallationFormErrors> = {
  orderId: "orderId",
  measuredById: "measurementMeasuredById",
  scheduledAt: "measurementScheduledAt",
  deliveryTimingType: "measurementDeliveryTimingType",
  deliveryDaysBefore: "measurementDeliveryDaysBefore",
  deliveryDate: "measurementDeliveryDate",
  additionalNotes: "measurementAdditionalNotes",
};

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

function toRequiredString(value: FormDataEntryValue | null): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
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

function toNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }
  return parsed;
}

function resolveDeliveryTimingType(value: FormDataEntryValue | null): DeliveryTimingType {
  if (typeof value === "string" && value === "EXACT_DATE") {
    return "EXACT_DATE";
  }
  return "DAYS_BEFORE";
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

function mapDeliveryErrors(error: unknown): CreateDeliveryFormState {
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

function mapMeasurementErrors(error: unknown): CreateInstallationFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (issues && Array.isArray(issues)) {
      const errors: CreateInstallationFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const mapped = measurementErrorFieldMap[fieldKey];
        if (mapped) {
          errors[mapped] = issue.message;
        }
      }
      return { status: "error", message: "Nie udało się zaplanować pomiaru.", errors };
    }
  }

  if (error instanceof Error) {
    return { status: "error", message: error.message };
  }

  return { status: "error", message: "Nie udało się zaplanować pomiaru." };
}

export async function createInstallationAction(
  _prevState: CreateInstallationFormState,
  formData: FormData,
): Promise<CreateInstallationFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const payload: Record<string, unknown> = {};

    for (const [name, value] of formData.entries()) {
      if (MEASUREMENT_FIELD_SET.has(name)) {
        continue;
      }

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

    let measurementInput: CreateMeasurementInput | null = null;
    const scheduleMeasurement = toBoolean(formData.get("scheduleMeasurement"));

    if (scheduleMeasurement) {
      const deliveryTimingType = resolveDeliveryTimingType(formData.get("measurementDeliveryTimingType"));

      const measurementData: CreateMeasurementInput = {
        orderId,
        measuredById: toNullableString(formData.get("measurementMeasuredById")) ?? null,
        scheduledAt: toDate(formData.get("measurementScheduledAt")) ?? null,
        measuredAt: null,
        measuredFloorArea: null,
        measuredBaseboardLength: null,
        offcutPercent: null,
        additionalNotes: toNullableString(formData.get("measurementAdditionalNotes")) ?? null,
        panelProductId: parsed.panelProductId ?? null,
        deliveryTimingType,
        deliveryDaysBefore:
          deliveryTimingType === "DAYS_BEFORE"
            ? toNullableNumber(formData.get("measurementDeliveryDaysBefore"))
            : null,
        deliveryDate:
          deliveryTimingType === "EXACT_DATE"
            ? toDate(formData.get("measurementDeliveryDate")) ?? null
            : null,
      };

      if (!measurementData.measuredById && parsed.assignedInstallerId) {
        measurementData.measuredById = parsed.assignedInstallerId;
      }

      if (!measurementData.measuredById) {
        return {
          status: "error",
          message: "Wskaż osobę odpowiedzialną za pomiar.",
          errors: {
            measurementMeasuredById: "Wymagamy przypisania ekipy do pomiaru, aby wysłać powiadomienie.",
          },
        };
      }

      try {
        measurementInput = createMeasurementSchema.parse(measurementData);
      } catch (error) {
        return mapMeasurementErrors(error);
      }
    }

    const installation = await createInstallation(installationInput, session.user.id);

    if (measurementInput) {
      try {
        await createMeasurement(measurementInput, session.user.id);
        revalidatePath("/pomiary");
      } catch (error) {
        return mapMeasurementErrors(error);
      }
    }

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

export async function updateInstallationAction(
  _prevState: CreateInstallationFormState,
  formData: FormData,
): Promise<CreateInstallationFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const payload: Record<string, unknown> = {};

    for (const [name, value] of formData.entries()) {
      if (MEASUREMENT_FIELD_SET.has(name)) {
        continue;
      }

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
    payload.installationId = toRequiredString(formData.get("installationId"));

    const parsed = updateInstallationSchema.parse(payload);

    const result = await updateInstallation(parsed, session.user.id);

    revalidatePath("/montaze");
    revalidatePath(`/montaze/${parsed.installationId}/edytuj`);
    revalidatePath(`/zlecenia/${result.orderId}`);
    redirect(`/zlecenia/${result.orderId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapZodErrors(error);
  }

  return { status: "idle" };
}

const DELIVERY_CHECKBOX_FIELDS = [
  "includePanels",
  "includeBaseboards",
  "proformaIssued",
  "depositOrFinalInvoiceIssued",
  "shippingOrdered",
  "reviewReceived",
  "requiresAdminAttention",
] as const;

type DeliveryCheckboxField = (typeof DELIVERY_CHECKBOX_FIELDS)[number];

const DELIVERY_DATE_FIELDS = ["scheduledDate"] as const;
type DeliveryDateField = (typeof DELIVERY_DATE_FIELDS)[number];

export async function createInstallationDeliveryAction(
  _prevState: CreateDeliveryFormState,
  formData: FormData,
): Promise<CreateDeliveryFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const installationId = toNullableString(formData.get("installationId"));

    if (!installationId) {
      return {
        status: "error",
        message: "Wybierz montaż, aby utworzyć powiązaną dostawę.",
        errors: { installationId: "Wskaż montaż." },
      };
    }

    const installationRecord = await db.query.installations.findFirst({
      where: eq(installations.id, installationId),
      columns: {
        id: true,
        orderId: true,
        addressStreet: true,
        addressCity: true,
        addressPostalCode: true,
      },
      with: {
        order: {
          columns: {
            id: true,
            clientId: true,
          },
        },
      },
    });

    if (!installationRecord || !installationRecord.order || !installationRecord.order.clientId) {
      return {
        status: "error",
        message: "Nie znaleziono montażu lub powiązanego klienta.",
        errors: { installationId: "Wybierz inny montaż." },
      };
    }

    const payload: Record<string, unknown> = {
      type: "FOR_INSTALLATION",
      clientId: installationRecord.order.clientId,
      orderId: installationRecord.orderId,
      installationId: installationRecord.id,
    };

    for (const field of DELIVERY_CHECKBOX_FIELDS) {
      payload[field] = toBoolean(formData.get(field));
    }

    for (const [name, value] of formData.entries()) {
      if (DELIVERY_CHECKBOX_FIELDS.includes(name as DeliveryCheckboxField)) {
        continue;
      }

      if (DELIVERY_DATE_FIELDS.includes(name as DeliveryDateField)) {
        payload[name] = toDate(value);
        continue;
      }

      if (name === "stage") {
        payload.stage = toRequiredString(value);
        continue;
      }

      if (name === "installationId") {
        continue;
      }

      payload[name] = toNullableString(value);
    }

    if (!payload.stage) {
      payload.stage = "RECEIVED";
    }

    payload.shippingAddressStreet =
      (payload.shippingAddressStreet as string | null | undefined) ?? installationRecord.addressStreet ?? null;
    payload.shippingAddressCity =
      (payload.shippingAddressCity as string | null | undefined) ?? installationRecord.addressCity ?? null;
    payload.shippingAddressPostalCode =
      (payload.shippingAddressPostalCode as string | null | undefined) ?? installationRecord.addressPostalCode ?? null;

    const parsed = createDeliverySchema.parse(payload);

    await createDelivery(parsed, session.user.id);

    revalidatePath("/dostawy");
    revalidatePath("/montaze");
    revalidatePath(`/zlecenia/${installationRecord.orderId}`);
    redirect(`/zlecenia/${installationRecord.orderId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapDeliveryErrors(error);
  }

  return { status: "idle" };
}
