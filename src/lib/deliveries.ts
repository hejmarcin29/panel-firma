import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  clients,
  deliveries,
  deliveryStatusHistory,
  installations,
  orders,
  orderStatusHistory,
  type DeliveryStage,
  type DeliveryType,
  products,
} from "@db/schema";

import type { CreateDeliveryInput, UpdateDeliveryInput } from "@/lib/deliveries/schemas";

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function createDelivery(payload: CreateDeliveryInput, userId: string | null) {
  return db.transaction((tx) => {
    const clientRecord = tx
      .select({ id: clients.id, clientNumber: clients.clientNumber })
      .from(clients)
      .where(eq(clients.id, payload.clientId))
      .get();

    if (!clientRecord) {
      throw new Error("Nie znaleziono klienta powiązanego z dostawą.");
    }

    const countRow = tx
      .select({ value: sql<number>`coalesce(count(*), 0)` })
      .from(deliveries)
      .where(eq(deliveries.clientId, payload.clientId))
      .get();

    const nextSequence = Number(countRow?.value ?? 0) + 1;
    const deliveryNumber = `${clientRecord.clientNumber}_D_${nextSequence}`;
    const now = new Date();

    let orderId = payload.orderId ?? null;

    if (!orderId) {
      const existingOrdersCountRow = tx
        .select({ value: sql<number>`coalesce(count(*), 0)` })
        .from(orders)
        .where(eq(orders.clientId, payload.clientId))
        .get();

      const nextOrderSequence = Number(existingOrdersCountRow?.value ?? 0) + 1;
      const generatedOrderNumber = `${clientRecord.clientNumber}_Z_${nextOrderSequence}`;

      const orderTitle =
        payload.type === "STANDALONE" ? "Tylko dostawa" : "Dostawa montażowa";

      const orderRecord: typeof orders.$inferInsert = {
        clientId: payload.clientId,
        partnerId: null,
        orderNumber: generatedOrderNumber,
        title: orderTitle,
        createdById: userId ?? null,
        ownerId: null,
        stage: "RECEIVED",
        executionMode: "DELIVERY_ONLY",
        stageNotes: normalizeText(payload.notes ?? null),
        stageChangedAt: now,
        declaredFloorArea: null,
        declaredBaseboardLength: null,
        buildingType: null,
        panelPreference: null,
        baseboardPreference: null,
        preferredPanelProductId: null,
        preferredBaseboardProductId: null,
        requiresAdminAttention: payload.requiresAdminAttention,
        quoteSent: false,
        depositInvoiceIssued: false,
        finalInvoiceIssued: false,
        createdAt: now,
        updatedAt: now,
      };

      const createdOrder = tx.insert(orders).values(orderRecord).returning().get();

      if (!createdOrder) {
        throw new Error("Nie udało się utworzyć zlecenia dla dostawy.");
      }

      tx
        .insert(orderStatusHistory)
        .values({
          orderId: createdOrder.id,
          changedById: userId,
          fromStage: null,
          toStage: createdOrder.stage,
          note: createdOrder.stageNotes,
          createdAt: now,
        })
        .run();

      orderId = createdOrder.id;
    }

    const record: typeof deliveries.$inferInsert = {
      deliveryNumber,
      type: payload.type,
      clientId: payload.clientId,
      orderId,
      installationId: payload.installationId ?? null,
      stage: payload.stage,
      scheduledDate: payload.scheduledDate ?? null,
      includePanels: payload.includePanels,
      panelProductId: payload.panelProductId ?? null,
      panelStyle: normalizeText(payload.panelStyle ?? null),
      includeBaseboards: payload.includeBaseboards,
      baseboardProductId: payload.baseboardProductId ?? null,
      shippingAddressStreet: normalizeText(payload.shippingAddressStreet ?? null),
      shippingAddressCity: normalizeText(payload.shippingAddressCity ?? null),
      shippingAddressPostalCode: normalizeText(payload.shippingAddressPostalCode ?? null),
      notes: normalizeText(payload.notes ?? null),
      proformaIssued: payload.proformaIssued,
      depositOrFinalInvoiceIssued: payload.depositOrFinalInvoiceIssued,
      shippingOrdered: payload.shippingOrdered,
      reviewReceived: payload.reviewReceived,
      requiresAdminAttention: payload.requiresAdminAttention,
      createdAt: now,
      updatedAt: now,
    };

    const created = tx.insert(deliveries).values(record).returning().get();

    if (!created) {
      throw new Error("Nie udało się utworzyć dostawy.");
    }

    tx.insert(deliveryStatusHistory).values({
      deliveryId: created.id,
      changedById: userId,
      fromStage: null,
      toStage: created.stage,
      note: created.notes,
      createdAt: now,
    }).run();

    return created;
  });
}

export async function updateDelivery(payload: UpdateDeliveryInput, userId: string | null) {
  const deliveryId = payload.deliveryId;

  return db.transaction((tx) => {
    const existing = tx
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .get();

    if (!existing) {
      throw new Error("Nie znaleziono dostawy.");
    }

    const now = new Date();

    const updatedRecord: Partial<typeof deliveries.$inferInsert> = {
      type: payload.type,
      clientId: payload.clientId,
      orderId: payload.orderId ?? null,
      installationId: payload.installationId ?? null,
      stage: payload.stage,
      scheduledDate: payload.scheduledDate ?? null,
      includePanels: payload.includePanels,
      panelProductId: payload.panelProductId ?? null,
      panelStyle: normalizeText(payload.panelStyle ?? null),
      includeBaseboards: payload.includeBaseboards,
      baseboardProductId: payload.baseboardProductId ?? null,
      shippingAddressStreet: normalizeText(payload.shippingAddressStreet ?? null),
      shippingAddressCity: normalizeText(payload.shippingAddressCity ?? null),
      shippingAddressPostalCode: normalizeText(payload.shippingAddressPostalCode ?? null),
      notes: normalizeText(payload.notes ?? null),
      proformaIssued: payload.proformaIssued,
      depositOrFinalInvoiceIssued: payload.depositOrFinalInvoiceIssued,
      shippingOrdered: payload.shippingOrdered,
      reviewReceived: payload.reviewReceived,
      requiresAdminAttention: payload.requiresAdminAttention,
      updatedAt: now,
    };

    tx
      .update(deliveries)
      .set(updatedRecord)
      .where(eq(deliveries.id, deliveryId))
      .run();

    if (existing.stage !== payload.stage) {
      tx
        .insert(deliveryStatusHistory)
        .values({
          deliveryId,
          changedById: userId,
          fromStage: existing.stage,
          toStage: payload.stage,
          note: normalizeText(payload.notes ?? null) ?? normalizeText(existing.notes ?? null),
          createdAt: now,
        })
        .run();
    }

    return {
      id: deliveryId,
      orderId: payload.orderId ?? existing.orderId,
      clientId: payload.clientId,
    };
  });
}

export const deliveryTypeLabels: Record<DeliveryType, string> = {
  FOR_INSTALLATION: "Na potrzeby montażu",
  STANDALONE: "Tylko dostawa",
};

export const deliveryStageSequence: DeliveryStage[] = [
  "RECEIVED",
  "PROFORMA_SENT_AWAITING_PAYMENT",
  "SHIPPING_ORDERED",
  "DELIVERED_AWAITING_FINAL_INVOICE",
  "COMPLETED",
];

export const deliveryStageLabels: Record<DeliveryStage, string> = {
  RECEIVED: "Przyjęto zamówienie",
  PROFORMA_SENT_AWAITING_PAYMENT: "Wysłano proformę – oczekiwanie na płatność",
  SHIPPING_ORDERED: "Zlecono wysyłkę – wysłano zaliczkową (z PF)",
  DELIVERED_AWAITING_FINAL_INVOICE: "Dostarczono – oczekuje na FV końcową",
  COMPLETED: "Koniec",
};

export const deliveryStageDescriptions: Partial<Record<DeliveryStage, string>> = {
  RECEIVED: "Nowe zlecenie logistyczne oczekuje na dalsze kroki.",
  PROFORMA_SENT_AWAITING_PAYMENT: "Klient otrzymał proformę – czekamy na potwierdzenie płatności.",
  SHIPPING_ORDERED: "Transport został zorganizowany i czeka na odbiór przez przewoźnika.",
  DELIVERED_AWAITING_FINAL_INVOICE: "Towar dotarł do klienta, pozostaje rozliczenie faktury końcowej.",
  COMPLETED: "Dostawa została rozliczona i zamknięta.",
};

export const deliveryStageBadgeClasses: Partial<Record<DeliveryStage, string>> = {
  RECEIVED: "bg-muted text-foreground",
  PROFORMA_SENT_AWAITING_PAYMENT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100",
  SHIPPING_ORDERED: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-100",
  DELIVERED_AWAITING_FINAL_INVOICE: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
};

export type DeliveriesSnapshot = {
  metrics: {
    total: number;
    awaitingPayment: number;
    shippingOrdered: number;
    completed: number;
    requiringAttention: number;
  };
  recent: Array<{
    id: string;
    deliveryNumber: string;
    stage: DeliveryStage;
    orderId: string | null;
    stageLabel: string;
    scheduledDate: Date | null;
    clientName: string | null;
    clientCity: string | null;
    type: DeliveryType;
    typeLabel: string;
    requiresAdminAttention: boolean;
    createdAt: Date;
  }>;
  distribution: Array<{
    stage: DeliveryStage;
    label: string;
    count: number;
  }>;
};

export async function getDeliveriesSnapshot(limit = 5): Promise<DeliveriesSnapshot> {
  const [metricsRow] = await db
    .select({
      total: sql<number>`coalesce(count(*), 0)`,
      awaitingPayment: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'PROFORMA_SENT_AWAITING_PAYMENT' then 1 else 0 end), 0)`,
      shippingOrdered: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'SHIPPING_ORDERED' then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'COMPLETED' then 1 else 0 end), 0)`,
      requiringAttention: sql<number>`coalesce(sum(case when ${deliveries.requiresAdminAttention} then 1 else 0 end), 0)`,
    })
    .from(deliveries)
    .where(eq(deliveries.type, "STANDALONE"));

  const distributionRows = await db
    .select({
      stage: deliveries.stage,
      count: sql<number>`count(*)`,
    })
    .from(deliveries)
    .where(eq(deliveries.type, "STANDALONE"))
    .groupBy(deliveries.stage);

  const recentRows = await db
    .select({
      id: deliveries.id,
      deliveryNumber: deliveries.deliveryNumber,
      stage: deliveries.stage,
      orderId: deliveries.orderId,
      scheduledDate: deliveries.scheduledDate,
      clientName: clients.fullName,
      clientCity: clients.city,
      type: deliveries.type,
      requiresAdminAttention: deliveries.requiresAdminAttention,
      createdAt: deliveries.createdAt,
    })
    .from(deliveries)
    .leftJoin(clients, eq(deliveries.clientId, clients.id))
    .where(eq(deliveries.type, "STANDALONE"))
    .orderBy(desc(deliveries.createdAt))
    .limit(limit);

  const metrics = {
    total: Number(metricsRow?.total ?? 0),
    awaitingPayment: Number(metricsRow?.awaitingPayment ?? 0),
    shippingOrdered: Number(metricsRow?.shippingOrdered ?? 0),
    completed: Number(metricsRow?.completed ?? 0),
    requiringAttention: Number(metricsRow?.requiringAttention ?? 0),
  } as const;

  const recent = recentRows.map((row) => ({
    id: row.id,
    deliveryNumber: row.deliveryNumber,
    stage: row.stage,
    orderId: row.orderId ?? null,
    stageLabel: deliveryStageLabels[row.stage],
    scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
    clientName: row.clientName ?? null,
  clientCity: row.clientCity ?? null,
    type: row.type,
    typeLabel: deliveryTypeLabels[row.type],
    requiresAdminAttention: Boolean(row.requiresAdminAttention),
    createdAt: new Date(row.createdAt),
  }));

  const distribution = (Object.entries(deliveryStageLabels) as Array<[DeliveryStage, string]>).map(
    ([stage, label]) => {
      const match = distributionRows.find((row) => row.stage === stage);
      return {
        stage,
        label,
        count: Number(match?.count ?? 0),
      };
    },
  );

  return { metrics, recent, distribution };
}

export type DeliverySelectItem = {
  id: string;
  label: string;
  stage: DeliveryStage;
  scheduledDate: Date | null;
};

export async function listDeliveriesForSelect(options?: {
  clientId?: string;
  stages?: DeliveryStage[];
}) {
  const baseQuery = db
    .select({
      id: deliveries.id,
      stage: deliveries.stage,
      scheduledDate: deliveries.scheduledDate,
      clientName: clients.fullName,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      installationId: deliveries.installationId,
      installationLabel: installations.id,
      panelProductName: products.name,
    })
    .from(deliveries)
    .leftJoin(clients, eq(deliveries.clientId, clients.id))
    .leftJoin(orders, eq(deliveries.orderId, orders.id))
    .leftJoin(installations, eq(deliveries.installationId, installations.id))
    .leftJoin(products, eq(deliveries.panelProductId, products.id))
    .where(eq(deliveries.type, "STANDALONE"))
    .orderBy(desc(deliveries.createdAt));

  const rows = options?.clientId
    ? options?.stages?.length
      ? await baseQuery.where(
          and(eq(deliveries.clientId, options.clientId), inArray(deliveries.stage, options.stages)),
        )
      : await baseQuery.where(eq(deliveries.clientId, options.clientId))
    : options?.stages?.length
      ? await baseQuery.where(inArray(deliveries.stage, options.stages))
      : await baseQuery;

  return rows.map((row) => {
    const reference = row.orderNumber?.trim().length ? row.orderNumber : row.id.slice(0, 6).toUpperCase();
    const title = row.orderTitle?.trim().length ? row.orderTitle : "Dostawa";
    const client = row.clientName ? ` · ${row.clientName}` : "";
    return {
      id: row.id,
      stage: row.stage,
      scheduledDate: row.scheduledDate,
      label: `${reference} – ${title}${client}`,
    } satisfies DeliverySelectItem;
  });
}

export async function getDeliveryForEdit(deliveryId: string) {
  const record = await db.query.deliveries.findFirst({
    where: (table, { eq }) => eq(table.id, deliveryId),
    with: {
      order: {
        with: {
          client: true,
        },
      },
      installation: true,
      client: true,
      panelProduct: true,
      baseboardProduct: true,
    },
  });

  return record ?? null;
}
