import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  clients,
  installationStatusHistory,
  installations,
  orders,
  users,
  type InstallationStatus,
  type OrderStage,
} from "@db/schema";

import { installationStatusLabels as installationStatusLabelsMap } from "./installations/constants";
import { orderStageLabels, orderStageSequence } from "@/lib/order-stage";

import type { CreateInstallationInput, UpdateInstallationInput } from "@/lib/installations/schemas";

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

  return db.transaction((tx) => {
    const orderRow = tx
      .select({
        orderId: orders.id,
        clientId: orders.clientId,
        clientNumber: clients.clientNumber,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, orderId))
      .get();

    if (!orderRow?.clientId || orderRow.clientNumber == null) {
      throw new Error("Nie znaleziono klienta powiązanego z montażem.");
    }

    const countRow = tx
      .select({
        value: sql<number>`coalesce(count(*), 0)`,
      })
      .from(installations)
      .leftJoin(orders, eq(installations.orderId, orders.id))
      .where(eq(orders.clientId, orderRow.clientId))
      .get();

    const nextSequence = Number(countRow?.value ?? 0) + 1;
    const installationNumber = `${orderRow.clientNumber}_M_${nextSequence}`;
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

    const created = tx.insert(installations).values(record).returning().get();

    if (!created) {
      throw new Error("Nie udało się utworzyć montażu.");
    }

    tx.insert(installationStatusHistory).values({
      installationId: created.id,
      changedById: userId,
      fromStatus: null,
      toStatus: created.status,
      note: created.additionalInfo,
      createdAt: now,
    }).run();

    return created;
  });
}

export async function updateInstallation(payload: UpdateInstallationInput, userId: string | null) {
  const installationId = payload.installationId;

  return db.transaction((tx) => {
    const existing = tx
      .select()
      .from(installations)
      .where(eq(installations.id, installationId))
      .get();

    if (!existing) {
      throw new Error("Nie znaleziono montażu.");
    }

    const nextOrderId = payload.orderId ?? existing.orderId;

    if (!nextOrderId) {
      throw new Error("Brakuje powiązanego zlecenia dla montażu.");
    }

    const now = new Date();

    const updatedRecord: Partial<typeof installations.$inferInsert> = {
      orderId: nextOrderId,
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
      updatedAt: now,
    };

    tx
      .update(installations)
      .set(updatedRecord)
      .where(eq(installations.id, installationId))
      .run();

    if (existing.status !== payload.status) {
      tx
        .insert(installationStatusHistory)
        .values({
          installationId,
          changedById: userId,
          fromStatus: existing.status,
          toStatus: payload.status,
          note:
            normalizeText(payload.additionalInfo ?? null) ??
            normalizeText(existing.additionalInfo ?? null),
          createdAt: now,
        })
        .run();
    }

    return {
      id: installationId,
      orderId: nextOrderId,
    };
  });
}

export type InstallationSelectItem = {
  id: string;
  label: string;
  orderId: string;
  status: InstallationStatus;
};

export type InstallationsListItem = {
  id: string;
  installationNumber: string;
  status: InstallationStatus;
  orderId: string;
  orderNumber: string | null;
  orderStage: OrderStage | null;
  clientName: string | null;
  clientCity: string | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  assignedInstallerName: string | null;
  requiresAdminAttention: boolean;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
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
      orderId: row.orderId ?? row.id,
      status: row.status,
    };
  });
}

export async function getInstallationForEdit(installationId: string) {
  const record = await db.query.installations.findFirst({
    where: (table, { eq }) => eq(table.id, installationId),
    with: {
      order: {
        with: {
          client: true,
        },
      },
      assignedInstaller: true,
      panelProduct: true,
      baseboardProduct: true,
    },
  });

  return record ?? null;
}

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
    orderId: string;
    status: InstallationStatus;
    statusLabel: string;
    scheduledStartAt: Date | null;
    city: string | null;
    clientName: string | null;
    orderReference: string;
  }>;
  distribution: Array<{
    stage: OrderStage;
    label: string;
    count: number;
  }>;
};

export type InstallationsFilters = {
  assignedInstallerId?: string;
  orderId?: string;
};

export async function getInstallationsSnapshot(limit = 5, filters?: InstallationsFilters): Promise<InstallationsSnapshot> {
  // Buduj warunki filtrowania
  const filterConditions = [];
  if (filters?.assignedInstallerId) {
    filterConditions.push(eq(installations.assignedInstallerId, filters.assignedInstallerId));
  }
  if (filters?.orderId) {
    filterConditions.push(eq(installations.orderId, filters.orderId));
  }

  const baseWhere = filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const [metricsRow] = await db
    .select({
      total: sql<number>`coalesce(count(*), 0)`,
      scheduled: sql<number>`coalesce(sum(case when ${installations.status} = 'SCHEDULED' then 1 else 0 end), 0)`,
      inProgress: sql<number>`coalesce(sum(case when ${installations.status} = 'IN_PROGRESS' then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${installations.status} = 'COMPLETED' then 1 else 0 end), 0)`,
      requiringAttention: sql<number>`coalesce(sum(case when ${installations.requiresAdminAttention} then 1 else 0 end), 0)`,
    })
    .from(installations)
    .where(baseWhere);

  const distributionRows = await db
    .select({
      stage: orders.stage,
      count: sql<number>`count(*)`,
    })
    .from(installations)
    .innerJoin(orders, eq(installations.orderId, orders.id))
    .where(baseWhere)
    .groupBy(orders.stage);

  const recentRows = await db
    .select({
      id: installations.id,
      installationNumber: installations.installationNumber,
      status: installations.status,
      scheduledStartAt: installations.scheduledStartAt,
      addressCity: installations.addressCity,
      clientName: clients.fullName,
      orderId: installations.orderId,
      orderNumber: orders.orderNumber,
    })
    .from(installations)
    .leftJoin(orders, eq(installations.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(baseWhere)
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
     orderId: row.orderId,
    status: row.status,
  statusLabel: installationStatusLabelsMap[row.status],
    scheduledStartAt: row.scheduledStartAt ? new Date(row.scheduledStartAt) : null,
    city: row.addressCity ?? null,
    clientName: row.clientName ?? null,
    orderReference: row.orderNumber ?? row.installationNumber,
  }));

  const distribution = orderStageSequence.map((stage) => {
    const match = distributionRows.find((row) => row.stage === stage);
    return {
      stage,
      label: orderStageLabels[stage],
      count: Number(match?.count ?? 0),
    };
  });

  return { metrics, recent, distribution };
}

export async function getInstallationsList(limit = 30, filters?: InstallationsFilters): Promise<InstallationsListItem[]> {
  // Buduj warunki filtrowania
  const filterConditions = [];
  if (filters?.assignedInstallerId) {
    filterConditions.push(eq(installations.assignedInstallerId, filters.assignedInstallerId));
  }
  if (filters?.orderId) {
    filterConditions.push(eq(installations.orderId, filters.orderId));
  }

  const baseWhere = filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const rows = await db
    .select({
      id: installations.id,
      installationNumber: installations.installationNumber,
      status: installations.status,
      orderId: installations.orderId,
      orderNumber: orders.orderNumber,
      orderStage: orders.stage,
      clientName: clients.fullName,
      clientCity: clients.city,
      scheduledStartAt: installations.scheduledStartAt,
      scheduledEndAt: installations.scheduledEndAt,
      actualStartAt: installations.actualStartAt,
      actualEndAt: installations.actualEndAt,
      assignedInstallerName: users.name,
      assignedInstallerUsername: users.username,
      requiresAdminAttention: installations.requiresAdminAttention,
      addressStreet: installations.addressStreet,
      addressCity: installations.addressCity,
      addressPostalCode: installations.addressPostalCode,
      createdAt: installations.createdAt,
    })
    .from(installations)
    .leftJoin(orders, eq(installations.orderId, orders.id))
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(installations.assignedInstallerId, users.id))
    .where(baseWhere)
    .orderBy(desc(installations.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    installationNumber: row.installationNumber,
    status: row.status,
    orderId: row.orderId,
    orderNumber: row.orderNumber ?? null,
    orderStage: row.orderStage ?? null,
    clientName: row.clientName ?? null,
    clientCity: row.clientCity ?? null,
    scheduledStartAt: row.scheduledStartAt ?? null,
    scheduledEndAt: row.scheduledEndAt ?? null,
    actualStartAt: row.actualStartAt ?? null,
    actualEndAt: row.actualEndAt ?? null,
    assignedInstallerName: row.assignedInstallerName ?? row.assignedInstallerUsername ?? null,
    requiresAdminAttention: Boolean(row.requiresAdminAttention),
    addressStreet: row.addressStreet ?? null,
    addressCity: row.addressCity ?? null,
    addressPostalCode: row.addressPostalCode ?? null,
  }));
}

export type InstallationsDashboardData = {
  snapshot: InstallationsSnapshot;
  list: InstallationsListItem[];
};

export async function getInstallationsDashboardData(limit = 30, filters?: InstallationsFilters): Promise<InstallationsDashboardData> {
  const [snapshot, list] = await Promise.all([
    getInstallationsSnapshot(limit, filters),
    getInstallationsList(limit, filters),
  ]);

  return { snapshot, list };
}

export { installationStatusLabels, installationStatusOptions } from "./installations/constants";