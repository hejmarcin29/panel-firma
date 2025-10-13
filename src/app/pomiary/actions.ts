"use server";

import { Buffer } from "node:buffer";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { db } from "@db/index";
import { attachments, orders } from "@db/schema";

import { requireRole } from "@/lib/auth";
import { uploadClientAttachment } from "@/lib/r2";
import { createMeasurement, updateMeasurement } from "@/lib/measurements";
import {
  createMeasurementSchema,
  updateMeasurementSchema,
  type CreateMeasurementFormErrors,
  type CreateMeasurementFormState,
} from "@/lib/measurements/schemas";
import { eq } from "drizzle-orm";

const DATE_FIELDS = ["scheduledAt", "measuredAt", "deliveryDate"] as const;
type DateField = (typeof DATE_FIELDS)[number];

const NUMBER_FIELDS = ["measuredFloorArea", "measuredBaseboardLength", "offcutPercent"] as const;
type NumberField = (typeof NUMBER_FIELDS)[number];

const INTEGER_FIELDS = ["deliveryDaysBefore"] as const;
type IntegerField = (typeof INTEGER_FIELDS)[number];

const OPTIONAL_STRING_FIELDS = ["measuredById", "panelProductId", "additionalNotes"] as const;
type OptionalStringField = (typeof OPTIONAL_STRING_FIELDS)[number];

const REQUIRED_STRING_FIELDS = ["orderId", "deliveryTimingType"] as const;
type RequiredStringField = (typeof REQUIRED_STRING_FIELDS)[number];

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRequiredString(value: FormDataEntryValue | null): string {
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function toNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function toInteger(value: FormDataEntryValue | null): number | null {
  const parsed = toNumber(value);
  if (parsed == null) {
    return null;
  }
  return Number.isInteger(parsed) ? parsed : Math.round(parsed);
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

function mapZodErrors(error: unknown): CreateMeasurementFormState {
  if (error instanceof Error && "issues" in error) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (issues && Array.isArray(issues)) {
      const errors: CreateMeasurementFormErrors = {};
      for (const issue of issues) {
        if (!issue.path || issue.path.length === 0) continue;
        const fieldKey = issue.path[0];
        if (typeof fieldKey !== "string") continue;
        const key = fieldKey as keyof CreateMeasurementFormErrors;
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

function extractFiles(formData: FormData) {
  const entries = formData.getAll("files");
  return entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function createMeasurementAction(
  _prevState: CreateMeasurementFormState,
  formData: FormData,
): Promise<CreateMeasurementFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const payload: Record<string, unknown> = {};

    for (const [name, value] of formData.entries()) {
      if (DATE_FIELDS.includes(name as DateField)) {
        payload[name] = toDate(value);
        continue;
      }

      if (NUMBER_FIELDS.includes(name as NumberField)) {
        payload[name] = toNumber(value);
        continue;
      }

      if (INTEGER_FIELDS.includes(name as IntegerField)) {
        payload[name] = toInteger(value);
        continue;
      }

      if (OPTIONAL_STRING_FIELDS.includes(name as OptionalStringField)) {
        payload[name] = toNullableString(value);
        continue;
      }

      if (REQUIRED_STRING_FIELDS.includes(name as RequiredStringField)) {
        payload[name] = toRequiredString(value);
        continue;
      }

      if (name === "files") {
        continue;
      }

      payload[name] = toNullableString(value);
    }

    const parsed = createMeasurementSchema.parse(payload);
    const files = extractFiles(formData);

    // MONTER może tworzyć pomiary tylko dla swoich zleceń
    if (session.user.role === 'MONTER') {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, parsed.orderId),
        columns: { assignedInstallerId: true }
      });

      if (!order || order.assignedInstallerId !== session.user.id) {
        return {
          status: "error",
          message: "Nie masz uprawnień do utworzenia pomiaru dla tego zlecenia.",
        };
      }
    }

    const result = await createMeasurement(parsed, session.user.id);

    if (files.length > 0) {
      if (!result.order.clientId) {
        return {
          status: "error",
          message: "Nie można powiązać załączników – brak klienta przypisanego do zlecenia.",
          errors: { files: "Załączniki nie zostały przesłane." },
        };
      }

      const uploadedAt = new Date();
      const attachmentValues = [] as Array<typeof attachments.$inferInsert>;

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const upload = await uploadClientAttachment({
          clientId: result.order.clientId,
          clientFullName: result.order.clientFullName,
          fileName: file.name,
          contentType: file.type || undefined,
          body: buffer,
          metadata: {
            "order-id": result.order.id,
            "measurement-id": result.measurement.id,
          },
        });

        attachmentValues.push({
          key: upload.key,
          fileName: upload.fileName,
          description: null,
          contentType: file.type || null,
          fileSize: file.size,
          uploadedById: session.user.id,
          orderId: result.order.id,
          measurementId: result.measurement.id,
          installationId: null,
          deliveryId: null,
          createdAt: uploadedAt,
        });
      }

      if (attachmentValues.length > 0) {
        await db.insert(attachments).values(attachmentValues).run();
      }
    }

    revalidatePath("/pomiary");
    revalidatePath("/zlecenia");
    revalidatePath(`/zlecenia/${result.order.id}`);
    redirect(`/zlecenia/${result.order.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return mapZodErrors(error);
  }

  return { status: "idle" };
}

export async function updateMeasurementAction(
  _prevState: CreateMeasurementFormState,
  formData: FormData,
): Promise<CreateMeasurementFormState> {
  try {
    const session = await requireRole(["ADMIN", "MONTER"]);

    const payload: Record<string, unknown> = {};

    for (const [name, value] of formData.entries()) {
      if (DATE_FIELDS.includes(name as DateField)) {
        payload[name] = toDate(value);
        continue;
      }

      if (NUMBER_FIELDS.includes(name as NumberField)) {
        payload[name] = toNumber(value);
        continue;
      }

      if (INTEGER_FIELDS.includes(name as IntegerField)) {
        payload[name] = toInteger(value);
        continue;
      }

      if (OPTIONAL_STRING_FIELDS.includes(name as OptionalStringField)) {
        payload[name] = toNullableString(value);
        continue;
      }

      if (REQUIRED_STRING_FIELDS.includes(name as RequiredStringField)) {
        payload[name] = toRequiredString(value);
        continue;
      }

      if (name === "files") {
        continue;
      }

      payload[name] = toNullableString(value);
    }

    payload.measurementId = toRequiredString(formData.get("measurementId"));

    const parsed = updateMeasurementSchema.parse(payload);
    const result = await updateMeasurement(parsed, session.user.id);

    revalidatePath("/pomiary");
    revalidatePath("/zlecenia");
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
