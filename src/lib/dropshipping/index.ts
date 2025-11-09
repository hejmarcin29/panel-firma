import { asc, desc, eq } from "drizzle-orm";

import { db } from "@db";
import {
  dropshippingChecklistItems,
  dropshippingOrderItems,
  dropshippingOrders,
  type DropshippingStage,
} from "@db/schema";

import {
  DROPSHIPPING_CHECKLIST_TEMPLATE,
  DROPSHIPPING_STAGE_DATE_FIELDS,
} from "./constants";

export interface CreateDropshippingOrderItemInput {
  title: string;
  packagesCount: number;
  areaM2?: number | null;
  pricePerPackage: number;
  pricePerSquareMeter: number;
  position: number;
}

export interface CreateDropshippingOrderInput {
  clientName: string;
  channel: string;
  channelReference?: string | null;
  vatRate: number;
  supplier?: string | null;
  notes?: string | null;
  items: CreateDropshippingOrderItemInput[];
}

interface OrderTotals {
  packages: number;
  area: number;
  netValue: number;
}

function calculateOrderTotals(items: CreateDropshippingOrderItemInput[]): OrderTotals {
  return items.reduce<OrderTotals>(
    (acc, item) => {
      const area = item.areaM2 ?? 0;
      const packagesValue = item.packagesCount * item.pricePerPackage;
      const areaValue = area > 0 ? Math.round(area * item.pricePerSquareMeter) : 0;

      return {
        packages: acc.packages + item.packagesCount,
        area: acc.area + area,
        netValue: acc.netValue + packagesValue + areaValue,
      };
    },
    { packages: 0, area: 0, netValue: 0 },
  );
}

export async function getNextDropshippingOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();

  const lastForYear = await db
    .select({ sequence: dropshippingOrders.sequence })
    .from(dropshippingOrders)
    .where(eq(dropshippingOrders.year, year))
    .orderBy(desc(dropshippingOrders.sequence))
    .limit(1);

  const nextSequence = (lastForYear[0]?.sequence ?? 0) + 1;
  return {
    orderNumber: `DS-${year}-${String(nextSequence).padStart(3, "0")}`,
    sequence: nextSequence,
    year,
  };
}

export async function createDropshippingOrder(input: CreateDropshippingOrderInput) {
  if (input.items.length === 0) {
    throw new Error("Dodaj co najmniej jedną pozycję towarową.");
  }

  return db.transaction(async (tx) => {
    const now = new Date();
    const year = now.getFullYear();

    const lastForYear = await tx
      .select({ sequence: dropshippingOrders.sequence })
      .from(dropshippingOrders)
      .where(eq(dropshippingOrders.year, year))
      .orderBy(desc(dropshippingOrders.sequence))
      .limit(1);

    const nextSequence = (lastForYear[0]?.sequence ?? 0) + 1;
    const orderNumber = `DS-${year}-${String(nextSequence).padStart(3, "0")}`;

    const totals = calculateOrderTotals(input.items);
    const grossValue = Math.round(totals.netValue * (1 + input.vatRate));
    const goodsSummary = input.items.map((item) => item.title).filter(Boolean).join(", ");

    const inserted = await tx
      .insert(dropshippingOrders)
      .values({
        clientName: input.clientName,
        channel: input.channel,
        channelReference: input.channelReference ?? null,
        goodsDescription: goodsSummary.length > 0 ? goodsSummary : null,
        packagesCount: totals.packages,
        areaM2: totals.area,
        netValue: totals.netValue,
        grossValue,
        vatRate: input.vatRate,
        supplier: input.supplier ?? null,
        notes: input.notes ?? null,
        year,
        sequence: nextSequence,
        orderNumber,
      })
      .returning({ id: dropshippingOrders.id, orderNumber: dropshippingOrders.orderNumber });

    const order = inserted[0];
    if (!order) {
      throw new Error("Nie udało się utworzyć zamówienia dropshipping.");
    }

    await tx.insert(dropshippingOrderItems).values(
      input.items.map((item) => ({
        orderId: order.id,
        position: item.position,
        title: item.title,
        packagesCount: item.packagesCount,
        areaM2: item.areaM2 ?? null,
        pricePerPackage: item.pricePerPackage,
        pricePerSquareMeter: item.pricePerSquareMeter,
      })),
    );

    await tx.insert(dropshippingChecklistItems).values(
      DROPSHIPPING_CHECKLIST_TEMPLATE.map((item, index) => ({
        orderId: order.id,
        title: item.title,
        description: item.description ?? null,
        position: index,
        isOptional: item.isOptional ?? false,
      })),
    );

    return order;
  });
}

export async function updateDropshippingStage(orderId: number, stage: DropshippingStage) {
  const dateFieldKey = DROPSHIPPING_STAGE_DATE_FIELDS[stage];
  const updateData: Record<string, unknown> = {
    status: stage,
    updatedAt: Date.now(),
  };

  if (dateFieldKey) {
    updateData[dateFieldKey] = Date.now();
  }

  await db.update(dropshippingOrders).set(updateData).where(eq(dropshippingOrders.id, orderId));
}

export async function toggleChecklistItem(orderId: number, itemId: number) {
  const [item] = await db
    .select({ isCompleted: dropshippingChecklistItems.isCompleted })
    .from(dropshippingChecklistItems)
    .where(eq(dropshippingChecklistItems.id, itemId))
    .limit(1);

  if (!item) {
    throw new Error("Checklista nie została znaleziona.");
  }

  const next = !item.isCompleted;

  await db
    .update(dropshippingChecklistItems)
    .set({
      isCompleted: next,
      completedAt: next ? new Date() : null,
    })
    .where(eq(dropshippingChecklistItems.id, itemId));
}

export async function getDropshippingOrderDetails(orderId: number) {
  const [order] = await db
    .select({
      id: dropshippingOrders.id,
      orderNumber: dropshippingOrders.orderNumber,
      clientName: dropshippingOrders.clientName,
      channel: dropshippingOrders.channel,
      channelReference: dropshippingOrders.channelReference,
      goodsDescription: dropshippingOrders.goodsDescription,
      packagesCount: dropshippingOrders.packagesCount,
      areaM2: dropshippingOrders.areaM2,
      netValue: dropshippingOrders.netValue,
      grossValue: dropshippingOrders.grossValue,
      vatRate: dropshippingOrders.vatRate,
      supplier: dropshippingOrders.supplier,
      notes: dropshippingOrders.notes,
      status: dropshippingOrders.status,
      proformaIssuedAt: dropshippingOrders.proformaIssuedAt,
      depositPaidAt: dropshippingOrders.depositPaidAt,
      supplierOrderAt: dropshippingOrders.supplierOrderAt,
      deliveryConfirmedAt: dropshippingOrders.deliveryConfirmedAt,
      finalInvoiceAt: dropshippingOrders.finalInvoiceAt,
      createdAt: dropshippingOrders.createdAt,
      updatedAt: dropshippingOrders.updatedAt,
    })
    .from(dropshippingOrders)
    .where(eq(dropshippingOrders.id, orderId))
    .limit(1);

  if (!order) {
    return null;
  }

  const items = await db
    .select({
      id: dropshippingOrderItems.id,
      title: dropshippingOrderItems.title,
      packagesCount: dropshippingOrderItems.packagesCount,
      areaM2: dropshippingOrderItems.areaM2,
      pricePerPackage: dropshippingOrderItems.pricePerPackage,
      pricePerSquareMeter: dropshippingOrderItems.pricePerSquareMeter,
      position: dropshippingOrderItems.position,
    })
    .from(dropshippingOrderItems)
    .where(eq(dropshippingOrderItems.orderId, orderId))
    .orderBy(asc(dropshippingOrderItems.position), asc(dropshippingOrderItems.id));

  const checklist = await db
    .select({
      id: dropshippingChecklistItems.id,
      title: dropshippingChecklistItems.title,
      description: dropshippingChecklistItems.description,
      position: dropshippingChecklistItems.position,
      isOptional: dropshippingChecklistItems.isOptional,
      isCompleted: dropshippingChecklistItems.isCompleted,
      completedAt: dropshippingChecklistItems.completedAt,
    })
    .from(dropshippingChecklistItems)
    .where(eq(dropshippingChecklistItems.orderId, orderId))
    .orderBy(asc(dropshippingChecklistItems.position));

  return {
    ...order,
    items,
    checklist,
  };
}
