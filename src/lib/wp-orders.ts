import { desc, eq } from "drizzle-orm";

import { db } from "@db";
import {
  incomingWpOrders,
  type IncomingWpOrderStatus,
} from "@db/schema";

interface WooAddress {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface WooMetaData {
  key?: string;
  value?: unknown;
  display_key?: string;
  display_value?: unknown;
}

interface WooLineItem {
  name?: string;
  sku?: string | null;
  meta_data?: WooMetaData[];
  categories?: Array<{ id?: number; name?: string; slug?: string }>;
}

export interface WooOrderPayload {
  id?: number | string;
  number?: string | number;
  status?: string;
  currency?: string;
  total?: string | number;
  total_tax?: string | number;
  billing?: WooAddress;
  shipping?: WooAddress;
  line_items?: WooLineItem[];
}

interface WooOrderSummary {
  wpOrderId: string;
  wpOrderNumber: string;
  wpStatus: string;
  customerName?: string;
  customerEmail?: string;
  totalGross: number;
  totalNet: number;
  currency: string;
  categories: string[];
  containsVinylPanels: boolean;
}

function toCents(value: string | number | undefined | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const numeric = typeof value === "number" ? value : Number.parseFloat(value.replace?.(",", ".") ?? String(value));
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100);
}

function slugifyCategory(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ąęółśżźćń\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractCategoriesFromMeta(meta: WooMetaData[] | undefined): string[] {
  if (!meta) {
    return [];
  }
  const collected = new Set<string>();
  for (const item of meta) {
    const potentialValues = [item.value, item.display_value]
      .map((entry) => (typeof entry === "string" ? slugifyCategory(entry) : null))
      .filter((entry): entry is string => Boolean(entry));
    for (const entry of potentialValues) {
      if (entry.includes("kategoria")) {
        collected.add(entry.replace(/.*kategoria-/, ""));
      } else {
        collected.add(entry);
      }
    }
    const keyCandidate = slugifyCategory(item.key ?? item.display_key);
    if (keyCandidate && keyCandidate.includes("kategoria")) {
      for (const value of potentialValues) {
        collected.add(value);
      }
    }
  }
  return Array.from(collected);
}

function collectCategories(order: WooOrderPayload): string[] {
  const categories = new Set<string>();
  for (const line of order.line_items ?? []) {
    for (const category of line.categories ?? []) {
      const slug = slugifyCategory(category.slug ?? category.name);
      if (slug) {
        categories.add(slug);
      }
    }
    for (const metaCategory of extractCategoriesFromMeta(line.meta_data)) {
      categories.add(metaCategory);
    }

    const nameSlug = slugifyCategory(line.name);
    if (nameSlug) {
      categories.add(nameSlug);
    }
  }
  return Array.from(categories);
}

function buildCustomerName(billing?: WooAddress, shipping?: WooAddress): string | undefined {
  const source = billing ?? shipping;
  if (!source) {
    return undefined;
  }
  const name = `${source.first_name ?? ""} ${source.last_name ?? ""}`.trim();
  return name.length > 0 ? name : undefined;
}

function summariseWooOrder(payload: WooOrderPayload): WooOrderSummary {
  const categories = collectCategories(payload).map((item) => slugifyCategory(item) ?? "").filter(Boolean) as string[];
  const containsVinylPanels = categories.some((item) => item === "panele-winylowe");

  const totalGross = toCents(payload.total);
  const totalTax = toCents(payload.total_tax);
  const totalNet = Math.max(totalGross - totalTax, 0);

  return {
    wpOrderId: String(payload.id ?? ""),
    wpOrderNumber: String(payload.number ?? payload.id ?? ""),
    wpStatus: payload.status ?? "pending",
    customerName: buildCustomerName(payload.billing, payload.shipping),
    customerEmail: payload.billing?.email ?? payload.shipping?.email,
    totalGross,
    totalNet,
    currency: (payload.currency ?? "PLN").toUpperCase(),
    categories,
    containsVinylPanels,
  };
}

export async function upsertIncomingWpOrder(rawPayload: WooOrderPayload, rawBody: string) {
  const summary = summariseWooOrder(rawPayload);

  if (!summary.wpOrderId) {
    throw new Error("Brak identyfikatora zamówienia WooCommerce.");
  }

  const categoriesJson = summary.categories.length > 0 ? JSON.stringify(summary.categories) : null;
  const now = new Date();

  const insertData: typeof incomingWpOrders.$inferInsert = {
    wpOrderId: summary.wpOrderId,
    wpOrderNumber: summary.wpOrderNumber,
    wpStatus: summary.wpStatus,
    status: "NEW",
    customerName: summary.customerName ?? null,
    customerEmail: summary.customerEmail ?? null,
    totalNet: summary.totalNet,
    totalGross: summary.totalGross,
    currency: summary.currency,
    containsVinylPanels: summary.containsVinylPanels,
    categoriesJson,
    rawPayload: rawBody,
    receivedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await db
    .insert(incomingWpOrders)
    .values(insertData)
    .onConflictDoUpdate({
      target: incomingWpOrders.wpOrderId,
      set: {
        wpOrderNumber: summary.wpOrderNumber,
        wpStatus: summary.wpStatus,
        customerName: summary.customerName ?? null,
        customerEmail: summary.customerEmail ?? null,
        totalNet: summary.totalNet,
        totalGross: summary.totalGross,
        currency: summary.currency,
        containsVinylPanels: summary.containsVinylPanels,
        categoriesJson,
        rawPayload: rawBody,
        receivedAt: now,
        updatedAt: now,
      },
    });

  return summary;
}

export interface PendingWpOrderDTO {
  id: number;
  wpOrderNumber: string;
  wpStatus: string;
  customerName?: string | null;
  customerEmail?: string | null;
  totalGross: number;
  currency: string;
  containsVinylPanels: boolean;
  categories: string[];
  receivedAt: number;
}

export async function listPendingWpOrders(limit = 6): Promise<PendingWpOrderDTO[]> {
  const rows = await db
    .select({
      id: incomingWpOrders.id,
      wpOrderNumber: incomingWpOrders.wpOrderNumber,
      wpStatus: incomingWpOrders.wpStatus,
      customerName: incomingWpOrders.customerName,
      customerEmail: incomingWpOrders.customerEmail,
      totalGross: incomingWpOrders.totalGross,
      currency: incomingWpOrders.currency,
      containsVinylPanels: incomingWpOrders.containsVinylPanels,
      categoriesJson: incomingWpOrders.categoriesJson,
      receivedAt: incomingWpOrders.receivedAt,
    })
    .from(incomingWpOrders)
    .where(eq(incomingWpOrders.status, "NEW"))
    .orderBy(desc(incomingWpOrders.receivedAt))
    .limit(limit);

  return rows.map((row) => {
    let categories: string[] = [];
    if (row.categoriesJson) {
      try {
        const parsed = JSON.parse(row.categoriesJson);
        if (Array.isArray(parsed)) {
          categories = parsed.filter((entry): entry is string => typeof entry === "string");
        }
      } catch {
        categories = [];
      }
    }

    return {
      id: row.id,
      wpOrderNumber: row.wpOrderNumber,
      wpStatus: row.wpStatus,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      totalGross: row.totalGross,
      currency: row.currency,
      containsVinylPanels: !!row.containsVinylPanels,
      categories,
      receivedAt: row.receivedAt?.getTime?.() ?? 0,
    } satisfies PendingWpOrderDTO;
  });
}

export async function updateIncomingWpOrderStatus(
  id: number,
  status: IncomingWpOrderStatus,
): Promise<void> {
  await db
    .update(incomingWpOrders)
    .set({
      status,
      importedAt: status === "IMPORTED" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(incomingWpOrders.id, id));
}
