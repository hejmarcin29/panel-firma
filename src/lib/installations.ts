import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  clients,
  installationStatusHistory,
  installations,
  orders,
  type InstallationStatus,
} from "@db/schema";

import type { CreateInstallationInput } from "@/lib/installations/schemas";

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function createInstallation(payload: CreateInstallationInput, userId: string | null) {
  const orderId = payload.orderId;

  if (!orderId) {
    throw new Error("Brakuje powiązanego zlecenia dla montażu.");
  }

  return db.transaction(async (tx) => {
    const orderRecord = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { id: true },
      with: {
        client: {
          columns: { id: true, clientNumber: true },
        },
      },
    });

    if (!orderRecord || !orderRecord.client) {
      throw new Error("Nie znaleziono klienta powiązanego z montażem.");
    }

    const [countRow] = await tx
      .select({
        value: sql<number>`coalesce(count(*), 0)`,
      })
      .from(installations)
      .leftJoin(orders, eq(installations.orderId, orders.id))
      .where(eq(orders.clientId, orderRecord.client.id));

    const nextSequence = Number(countRow?.value ?? 0) + 1;
    const installationNumber = `${orderRecord.client.clientNumber}_M_${nextSequence}`;
    const now = new Date();

    const record: typeof installations.$inferInsert = {
      installationNumber,
      orderId,
      assignedInstallerId: payload.assignedInstallerId ?? null,
      status: payload.status,
      scheduledStartAt: payload.scheduledStartAt ?? null,
      scheduledEndAt: payload.scheduledEndAt ?? null,
      actualStartAt: payload.actualStartAt ?? null,
      actualEndAt: payload.actualEndAt ?? null,
      addressStreet: normalizeText(payload.addressStreet ?? null),
      addressCity: normalizeText(payload.addressCity ?? null),
      addressPostalCode: normalizeText(payload.addressPostalCode ?? null),
      locationPinUrl: normalizeText(payload.locationPinUrl ?? null),
      panelProductId: payload.panelProductId ?? null,
      baseboardProductId: payload.baseboardProductId ?? null,
      additionalWork: normalizeText(payload.additionalWork ?? null),
      additionalInfo: normalizeText(payload.additionalInfo ?? null),
      customerNotes: normalizeText(payload.customerNotes ?? null),
      handoverProtocolSigned: payload.handoverProtocolSigned,
      reviewReceived: payload.reviewReceived,
      requiresAdminAttention: payload.requiresAdminAttention,
      createdAt: now,
      updatedAt: now,
    };

    const [created] = await tx.insert(installations).values(record).returning();

    if (!created) {
      throw new Error("Nie udało się utworzyć montażu.");
    }

    await tx.insert(installationStatusHistory).values({
      installationId: created.id,
      changedById: userId,
      fromStatus: null,
      toStatus: created.status,
      note: created.additionalInfo,
      createdAt: now,
    });

    return created;
  });
}

export type InstallationSelectItem = {
  id: string;
  label: string;
  orderId: string;
  status: InstallationStatus;
};

export async function listInstallationsForSelect(options?: {
  orderId?: string;
  statuses?: InstallationStatus[];
}): Promise<InstallationSelectItem[]> {
  const query = db
    .select({
      id: installations.id,
      status: installations.status,
      orderId: installations.orderId,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      clientName: clients.fullName,
    })
    .from(installations)
    .leftJoin(orders, eq(installations.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .orderBy(desc(installations.createdAt));

  const rows = options?.orderId
    ? options?.statuses?.length
      ? await query.where(
          and(
            eq(installations.orderId, options.orderId),
            inArray(installations.status, options.statuses),
          ),
        )
      : await query.where(eq(installations.orderId, options.orderId))
    : options?.statuses?.length
      ? await query.where(inArray(installations.status, options.statuses))
      : await query;

  return rows.map((row) => {
    const reference = row.orderNumber?.trim().length ? row.orderNumber : row.orderId.slice(0, 6).toUpperCase();
    const title = row.orderTitle?.trim().length ? row.orderTitle : "Zlecenie";
    const client = row.clientName ? ` · ${row.clientName}` : "";
    return {
      id: row.id,
      label: `${reference} – ${title}${client}`,
      orderId: row.orderId,
      status: row.status,
    };
  });
}

export const installationStatusLabels: Record<InstallationStatus, string> = {
  PLANNED: "Planowany",
  SCHEDULED: "Zaplanowany",
  IN_PROGRESS: "W realizacji",
  COMPLETED: "Zakończony",
  ON_HOLD: "Wstrzymany",
  CANCELLED: "Anulowany",
};

export type InstallationsSnapshot = {
  metrics: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    requiringAttention: number;
  };
  recent: Array<{
    id: string;
    installationNumber: string;
    status: InstallationStatus;
    statusLabel: string;
    scheduledStartAt: Date | null;
    city: string | null;
    clientName: string | null;
    orderReference: string;
  }>;
};

export async function getInstallationsSnapshot(limit = 5): Promise<InstallationsSnapshot> {
  const [metricsRow] = await db
    .select({
      total: sql<number>`coalesce(count(*), 0)`,
      scheduled: sql<number>`coalesce(sum(case when ${installations.status} = 'SCHEDULED' then 1 else 0 end), 0)`,
      inProgress: sql<number>`coalesce(sum(case when ${installations.status} = 'IN_PROGRESS' then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${installations.status} = 'COMPLETED' then 1 else 0 end), 0)`,
      requiringAttention: sql<number>`coalesce(sum(case when ${installations.requiresAdminAttention} then 1 else 0 end), 0)`,
    })
    .from(installations);

  const recentRows = await db
    .select({
      id: installations.id,
      installationNumber: installations.installationNumber,
      status: installations.status,
      scheduledStartAt: installations.scheduledStartAt,
      addressCity: installations.addressCity,
      clientName: clients.fullName,
      orderNumber: orders.orderNumber,
    })
    .from(installations)
    .leftJoin(orders, eq(installations.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .orderBy(desc(installations.createdAt))
    .limit(limit);

  const metrics = {
    total: Number(metricsRow?.total ?? 0),
    scheduled: Number(metricsRow?.scheduled ?? 0),
    inProgress: Number(metricsRow?.inProgress ?? 0),
    completed: Number(metricsRow?.completed ?? 0),
    requiringAttention: Number(metricsRow?.requiringAttention ?? 0),
  } as const;

  const recent = recentRows.map((row) => ({
    id: row.id,
    installationNumber: row.installationNumber,
    status: row.status,
    statusLabel: installationStatusLabels[row.status],
    scheduledStartAt: row.scheduledStartAt ? new Date(row.scheduledStartAt) : null,
    city: row.addressCity ?? null,
    clientName: row.clientName ?? null,
    orderReference: row.orderNumber ?? row.installationNumber,
  }));

  return { metrics, recent };
}