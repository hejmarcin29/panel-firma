"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { DropshippingStage } from "@db/schema";

import {
  createDropshippingOrder,
  toggleChecklistItem,
  updateDropshippingStage,
} from "@/lib/dropshipping";

import {
  createDropshippingOrderSchema,
  toggleChecklistItemSchema,
  updateDropshippingStageSchema,
} from "./schema";

interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function getStringValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseItemsField(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export async function createDropshippingOrderAction(
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState | null> {
  const raw = {
    clientName: formData.get("clientName"),
    channel: formData.get("channel"),
    channelReference: formData.get("channelReference"),
    vatRate: formData.get("vatRate"),
    supplier: formData.get("supplier"),
    notes: formData.get("notes"),
    items: formData.get("items"),
  };

  const parsedItems = parseItemsField(raw.items);
  if (parsedItems === null) {
    return {
      error: "Nie udało się odczytać pozycji towarowych.",
      fieldErrors: { items: "Nie udało się odczytać pozycji towarowych." },
    };
  }

  const submission = createDropshippingOrderSchema.safeParse({
    clientName: typeof raw.clientName === "string" ? raw.clientName : "",
    channel: typeof raw.channel === "string" ? raw.channel : "",
    channelReference: getStringValue(raw.channelReference),
    vatRate: typeof raw.vatRate === "string" ? raw.vatRate : "23",
    supplier: typeof raw.supplier === "string" ? raw.supplier : "",
    notes: getStringValue(raw.notes),
    items: parsedItems,
  });

  if (!submission.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of submission.error.issues) {
      const path = issue.path[0];
      if (path === "items") {
        fieldErrors.items = "Uzupełnij poprawnie pozycje towarowe.";
      } else if (typeof path === "string" && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return { error: "Uzupełnij poprawnie formularz.", fieldErrors };
  }

  const data = submission.data;
  const vatRateNumeric = Number(data.vatRate);

  const itemsForInsert = data.items.map((item, index) => ({
    title: item.title,
    packagesCount: Math.max(0, item.packagesCount),
    areaM2: item.areaM2 ?? null,
    pricePerPackage: Math.max(0, Math.round(item.pricePerPackage * 100)),
    pricePerSquareMeter: Math.max(0, Math.round(item.pricePerSquareMeter * 100)),
    position: index,
  }));

  const order = await createDropshippingOrder({
    clientName: data.clientName,
    channel: data.channel,
    channelReference: data.channelReference ?? null,
    vatRate: vatRateNumeric / 100,
    supplier: data.supplier,
    notes: data.notes ?? null,
    items: itemsForInsert,
  });

  revalidatePath("/dropshipping");
  revalidatePath(`/dropshipping/${order.id}`);

  redirect(`/dropshipping/${order.id}`);
}

export async function updateDropshippingStageAction(formData: FormData) {
  const rawOrderId = formData.get("orderId");
  const rawStage = formData.get("stage");

  const parsed = updateDropshippingStageSchema.safeParse({
    orderId: Number(rawOrderId),
    stage: typeof rawStage === "string" ? rawStage : "",
  });

  if (!parsed.success) {
    return { error: "Nie udało się zaktualizować etapu." };
  }

  await updateDropshippingStage(parsed.data.orderId, parsed.data.stage as DropshippingStage);

  revalidatePath("/dropshipping");
  revalidatePath(`/dropshipping/${parsed.data.orderId}`);
}

export async function toggleChecklistItemAction(formData: FormData) {
  const rawOrderId = formData.get("orderId");
  const rawItemId = formData.get("itemId");

  const parsed = toggleChecklistItemSchema.safeParse({
    orderId: Number(rawOrderId),
    itemId: Number(rawItemId),
  });

  if (!parsed.success) {
    return { error: "Nie udało się zaktualizować checklisty." };
  }

  await toggleChecklistItem(parsed.data.orderId, parsed.data.itemId);

  revalidatePath(`/dropshipping/${parsed.data.orderId}`);
}
