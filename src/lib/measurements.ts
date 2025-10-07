import { desc, eq, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  attachments,
  clients,
  measurementAdjustments,
  measurements,
  orders,
  products,
  users,
  type DeliveryTimingType,
} from "@db/schema";

import {
  deliveryTimingLabels,
  resolveMeasurementStatus,
  type MeasurementStatus,
} from "@/lib/measurements/constants";
import type {
  CreateMeasurementInput,
  UpdateMeasurementInput,
} from "@/lib/measurements/schemas";

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableNumber = (value: number | null | undefined) => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const toNullableDate = (value: Date | null | undefined) => {
  if (!(value instanceof Date)) {
    return null;
  }
  return Number.isNaN(value.getTime()) ? null : value;
};

const toNullableString = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export type CreateMeasurementResult = {
  measurement: typeof measurements.$inferSelect;
  order: {
    id: string;
    clientId: string | null;
    clientFullName: string | null;
    clientNumber: number | null;
  };
};

export async function createMeasurement(
  payload: CreateMeasurementInput,
  _userId: string | null,
): Promise<CreateMeasurementResult> {
  void _userId
  return db.transaction((tx) => {
    const orderRow = tx
      .select({
        id: orders.id,
        clientId: orders.clientId,
        clientFullName: clients.fullName,
        clientNumber: clients.clientNumber,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, payload.orderId))
      .get();

    if (!orderRow) {
      throw new Error("Nie znaleziono zlecenia powiązanego z pomiarem.");
    }

    const now = new Date();
    const deliveryDaysBefore =
      payload.deliveryTimingType === "DAYS_BEFORE" ? toNullableNumber(payload.deliveryDaysBefore ?? null) : null;
    const deliveryDate =
      payload.deliveryTimingType === "EXACT_DATE" ? toNullableDate(payload.deliveryDate ?? null) : null;

    const record: typeof measurements.$inferInsert = {
      orderId: payload.orderId,
      measuredById: toNullableString(payload.measuredById ?? null),
      scheduledAt: toNullableDate(payload.scheduledAt ?? null),
      measuredAt: toNullableDate(payload.measuredAt ?? null),
      measuredFloorArea: toNullableNumber(payload.measuredFloorArea ?? null),
      measuredBaseboardLength: toNullableNumber(payload.measuredBaseboardLength ?? null),
      offcutPercent: toNullableNumber(payload.offcutPercent ?? null),
      additionalNotes: normalizeText(payload.additionalNotes ?? null),
      panelProductId: toNullableString(payload.panelProductId ?? null),
      deliveryTimingType: payload.deliveryTimingType,
      deliveryDaysBefore,
      deliveryDate,
      createdAt: now,
      updatedAt: now,
    };

    const created = tx.insert(measurements).values(record).returning().get();

    if (!created) {
      throw new Error("Nie udało się utworzyć pomiaru.");
    }

    return {
      measurement: created,
      order: {
        id: orderRow.id,
        clientId: orderRow.clientId ?? null,
        clientFullName: orderRow.clientFullName ?? null,
        clientNumber: orderRow.clientNumber ?? null,
      },
    };
  });
}

export type UpdateMeasurementResult = {
  measurementId: string;
  orderId: string;
};

export async function updateMeasurement(
  payload: UpdateMeasurementInput,
  _userId: string | null,
): Promise<UpdateMeasurementResult> {
  void _userId
  const measurementId = payload.measurementId;

  return db.transaction((tx) => {
    const existing = tx
      .select({
        id: measurements.id,
        orderId: measurements.orderId,
      })
      .from(measurements)
      .where(eq(measurements.id, measurementId))
      .get();

    if (!existing) {
      throw new Error("Nie znaleziono pomiaru.");
    }

    const deliveryDaysBefore =
      payload.deliveryTimingType === "DAYS_BEFORE" ? toNullableNumber(payload.deliveryDaysBefore ?? null) : null;
    const deliveryDate =
      payload.deliveryTimingType === "EXACT_DATE" ? toNullableDate(payload.deliveryDate ?? null) : null;
    const now = new Date();

    const updatedRecord: Partial<typeof measurements.$inferInsert> = {
      measuredById: toNullableString(payload.measuredById ?? null),
      scheduledAt: toNullableDate(payload.scheduledAt ?? null),
      measuredAt: toNullableDate(payload.measuredAt ?? null),
      measuredFloorArea: toNullableNumber(payload.measuredFloorArea ?? null),
      measuredBaseboardLength: toNullableNumber(payload.measuredBaseboardLength ?? null),
      offcutPercent: toNullableNumber(payload.offcutPercent ?? null),
      additionalNotes: normalizeText(payload.additionalNotes ?? null),
      panelProductId: toNullableString(payload.panelProductId ?? null),
      deliveryTimingType: payload.deliveryTimingType,
      deliveryDaysBefore,
      deliveryDate,
      updatedAt: now,
    };

    tx.update(measurements).set(updatedRecord).where(eq(measurements.id, measurementId)).run();

    return {
      measurementId,
      orderId: existing.orderId,
    };
  });
}

export type MeasurementsSnapshot = {
  metrics: {
    total: number;
    planned: number;
    completed: number;
    overdue: number;
    awaitingDeliveryPlan: number;
    withAdjustments: number;
  };
  recent: Array<{
    id: string;
    orderId: string;
    orderReference: string;
    clientName: string;
    clientCity: string | null;
    scheduledAt: Date | null;
    measuredAt: Date | null;
    measuredFloorArea: number | null;
    status: MeasurementStatus;
    adjustments: number;
  }>;
  distribution: Array<{
    deliveryTimingType: DeliveryTimingType;
    label: string;
    count: number;
  }>;
};

export async function getMeasurementsSnapshot(limit = 6): Promise<MeasurementsSnapshot> {
  const now = new Date();
  const nowTimestamp = now.getTime();

  const [metricsRow] = await db
    .select({
      total: sql<number>`coalesce(count(*), 0)`,
      planned: sql<number>`coalesce(sum(case when ${measurements.measuredAt} is null and ${measurements.scheduledAt} is not null and ${measurements.scheduledAt} >= ${nowTimestamp} then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${measurements.measuredAt} is not null then 1 else 0 end), 0)`,
      overdue: sql<number>`coalesce(sum(case when ${measurements.measuredAt} is null and ${measurements.scheduledAt} is not null and ${measurements.scheduledAt} < ${nowTimestamp} then 1 else 0 end), 0)`,
      awaitingDeliveryPlan: sql<number>`coalesce(sum(case when (${measurements.deliveryTimingType} = 'DAYS_BEFORE' and ${measurements.deliveryDaysBefore} is null) or (${measurements.deliveryTimingType} = 'EXACT_DATE' and ${measurements.deliveryDate} is null) then 1 else 0 end), 0)`,
    })
    .from(measurements);

  const [adjustmentsRow] = await db
    .select({
      value: sql<number>`coalesce(count(distinct ${measurementAdjustments.measurementId}), 0)`,
    })
    .from(measurementAdjustments);

  const recentRows = await db
    .select({
      id: measurements.id,
      orderId: measurements.orderId,
      scheduledAt: measurements.scheduledAt,
      measuredAt: measurements.measuredAt,
      measuredFloorArea: measurements.measuredFloorArea,
      clientName: clients.fullName,
      clientCity: clients.city,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      createdAt: measurements.createdAt,
      deliveryTimingType: measurements.deliveryTimingType,
      deliveryDaysBefore: measurements.deliveryDaysBefore,
      deliveryDate: measurements.deliveryDate,
      adjustments: sql<number>`coalesce(count(distinct ${measurementAdjustments.id}), 0)`,
    })
    .from(measurements)
    .leftJoin(orders, eq(measurements.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(measurementAdjustments, eq(measurementAdjustments.measurementId, measurements.id))
    .groupBy(
      measurements.id,
      measurements.orderId,
      measurements.scheduledAt,
      measurements.measuredAt,
      measurements.measuredFloorArea,
      clients.fullName,
      clients.city,
      orders.orderNumber,
      orders.title,
      measurements.createdAt,
      measurements.deliveryTimingType,
      measurements.deliveryDaysBefore,
      measurements.deliveryDate,
    )
    .orderBy(desc(measurements.createdAt))
    .limit(limit);

  const distributionRows = await db
    .select({
      deliveryTimingType: measurements.deliveryTimingType,
      count: sql<number>`count(*)`,
    })
    .from(measurements)
    .groupBy(measurements.deliveryTimingType);

  const metrics = {
    total: Number(metricsRow?.total ?? 0),
    planned: Number(metricsRow?.planned ?? 0),
    completed: Number(metricsRow?.completed ?? 0),
    overdue: Number(metricsRow?.overdue ?? 0),
    awaitingDeliveryPlan: Number(metricsRow?.awaitingDeliveryPlan ?? 0),
    withAdjustments: Number(adjustmentsRow?.value ?? 0),
  } as const;

  const recent = recentRows.map((row) => {
    const scheduledAt = toNullableDate(row.scheduledAt ?? null);
    const measuredAt = toNullableDate(row.measuredAt ?? null);
    const status = resolveMeasurementStatus({ scheduledAt, measuredAt, now });
    const orderReference = row.orderNumber?.trim().length
      ? row.orderNumber
      : row.orderId.slice(0, 6).toUpperCase();

    return {
      id: row.id,
      orderId: row.orderId,
      orderReference,
      clientName: row.clientName ?? "Klient nieznany",
      clientCity: row.clientCity ?? null,
      scheduledAt,
      measuredAt,
      measuredFloorArea: toNullableNumber(row.measuredFloorArea ?? null),
      status,
      adjustments: Number(row.adjustments ?? 0),
    };
  });

  const distribution = deliveryTimingLabels
    ? (Object.entries(deliveryTimingLabels) as Array<[DeliveryTimingType, string]>).map(([type, label]) => {
        const match = distributionRows.find((row) => row.deliveryTimingType === type);
        return {
          deliveryTimingType: type,
          label,
          count: Number(match?.count ?? 0),
        };
      })
    : [];

  return {
    metrics,
    recent,
    distribution,
  };
}

export type MeasurementListItem = {
  id: string;
  orderId: string;
  orderReference: string;
  clientName: string;
  clientCity: string | null;
  scheduledAt: Date | null;
  measuredAt: Date | null;
  measuredBy: string | null;
  measuredFloorArea: number | null;
  measuredBaseboardLength: number | null;
  offcutPercent: number | null;
  panelProductName: string | null;
  deliveryTimingType: DeliveryTimingType;
  deliveryDaysBefore: number | null;
  deliveryDate: Date | null;
  attachmentsCount: number;
  adjustmentsCount: number;
  requiresAttention: boolean;
  status: MeasurementStatus;
  createdAt: Date;
};

export async function getMeasurementsList(limit = 30): Promise<MeasurementListItem[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: measurements.id,
      orderId: measurements.orderId,
      scheduledAt: measurements.scheduledAt,
      measuredAt: measurements.measuredAt,
      measuredFloorArea: measurements.measuredFloorArea,
      measuredBaseboardLength: measurements.measuredBaseboardLength,
      offcutPercent: measurements.offcutPercent,
      deliveryTimingType: measurements.deliveryTimingType,
      deliveryDaysBefore: measurements.deliveryDaysBefore,
      deliveryDate: measurements.deliveryDate,
      createdAt: measurements.createdAt,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      clientName: clients.fullName,
      clientCity: clients.city,
      measuredByName: users.name,
      measuredByUsername: users.username,
      panelProductName: products.name,
      adjustmentsCount: sql<number>`coalesce(count(distinct ${measurementAdjustments.id}), 0)`,
      attachmentsCount: sql<number>`coalesce(count(distinct ${attachments.id}), 0)`,
    })
    .from(measurements)
    .leftJoin(orders, eq(measurements.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(measurements.measuredById, users.id))
    .leftJoin(products, eq(measurements.panelProductId, products.id))
    .leftJoin(measurementAdjustments, eq(measurementAdjustments.measurementId, measurements.id))
    .leftJoin(attachments, eq(attachments.measurementId, measurements.id))
    .groupBy(
      measurements.id,
      measurements.orderId,
      measurements.scheduledAt,
      measurements.measuredAt,
      measurements.measuredFloorArea,
      measurements.measuredBaseboardLength,
      measurements.offcutPercent,
      measurements.deliveryTimingType,
      measurements.deliveryDaysBefore,
      measurements.deliveryDate,
      measurements.createdAt,
      orders.orderNumber,
      orders.title,
      clients.fullName,
      clients.city,
      users.name,
      users.username,
      products.name,
    )
    .orderBy(desc(measurements.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const scheduledAt = toNullableDate(row.scheduledAt ?? null);
    const measuredAt = toNullableDate(row.measuredAt ?? null);
    const status = resolveMeasurementStatus({ scheduledAt, measuredAt, now });

    const orderReference = row.orderNumber?.trim().length
      ? row.orderNumber
      : row.orderId.slice(0, 6).toUpperCase();

    const measuredBy = toNullableString(row.measuredByName ?? null) ?? toNullableString(row.measuredByUsername ?? null);

    const deliveryTimingType = row.deliveryTimingType as DeliveryTimingType;
    const deliveryDaysBefore = toNullableNumber(row.deliveryDaysBefore ?? null);
    const deliveryDate = toNullableDate(row.deliveryDate ?? null);

    const requiresAttention =
      status === "OVERDUE" ||
      (deliveryTimingType === "DAYS_BEFORE" && (deliveryDaysBefore == null || deliveryDaysBefore < 0)) ||
      (deliveryTimingType === "EXACT_DATE" && deliveryDate == null);

    return {
      id: row.id,
      orderId: row.orderId,
      orderReference,
      clientName: row.clientName ?? "Klient nieznany",
      clientCity: row.clientCity ?? null,
      scheduledAt,
      measuredAt,
      measuredBy,
      measuredFloorArea: toNullableNumber(row.measuredFloorArea ?? null),
      measuredBaseboardLength: toNullableNumber(row.measuredBaseboardLength ?? null),
      offcutPercent: toNullableNumber(row.offcutPercent ?? null),
      panelProductName: row.panelProductName ?? null,
      deliveryTimingType,
      deliveryDaysBefore,
      deliveryDate,
      attachmentsCount: Number(row.attachmentsCount ?? 0),
      adjustmentsCount: Number(row.adjustmentsCount ?? 0),
      requiresAttention,
      status,
      createdAt: row.createdAt,
    };
  });
}

export async function getMeasurementsDashboardData(limit = 30) {
  const [snapshot, list] = await Promise.all([
    getMeasurementsSnapshot(6),
    getMeasurementsList(limit),
  ]);

  return {
    snapshot,
    list,
  };
}
