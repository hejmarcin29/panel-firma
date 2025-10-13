import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  clients,
  deliveries,
  installations,
  orders,
  type DeliveryStage,
} from "@db/schema";

import { deliveryStageLabels } from "@/lib/deliveries";
import { installationStatusLabels } from "@/lib/installations";

export type InstallationDeliveriesSnapshot = {
  metrics: {
    total: number;
    scheduled: number;
    shippingOrdered: number;
    deliveredAwaitingFinal: number;
    completed: number;
    requiringAttention: number;
  };
  recent: Array<{
    id: string;
    deliveryNumber: string;
    stage: DeliveryStage;
    stageLabel: string;
    scheduledDate: Date | null;
    installationId: string | null;
    installationNumber: string | null;
    installationStatus: string | null;
    clientName: string | null;
  }>;
  distribution: Array<{
    stage: DeliveryStage;
    label: string;
    count: number;
  }>;
};

export type InstallationDeliveryListItem = {
  id: string;
  deliveryNumber: string;
  stage: DeliveryStage;
  stageLabel: string;
  scheduledDate: Date | null;
  requiresAdminAttention: boolean;
  installationId: string | null;
  installationNumber: string | null;
  installationStatus: string | null;
  installationStatusLabel: string | null;
  installationStart: Date | null;
  installationEnd: Date | null;
  orderId: string | null;
  orderReference: string | null;
  clientName: string | null;
};

export type InstallationDeliveriesDashboardData = {
  snapshot: InstallationDeliveriesSnapshot;
  list: InstallationDeliveryListItem[];
};

export type InstallationDeliveriesFilters = {
  assignedInstallerId?: string;
};

export async function getInstallationDeliveriesSnapshot(limit = 5, filters?: InstallationDeliveriesFilters): Promise<InstallationDeliveriesSnapshot> {
  
  // Jeśli filtrujemy po monterze, musimy dołączyć installations i orders
  if (filters?.assignedInstallerId) {
    const [metricsRow] = await db
      .select({
        total: sql<number>`coalesce(count(*), 0)`,
        scheduled: sql<number>`coalesce(sum(case when ${deliveries.stage} in ('RECEIVED', 'PROFORMA_SENT_AWAITING_PAYMENT') then 1 else 0 end), 0)`,
        shippingOrdered: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'SHIPPING_ORDERED' then 1 else 0 end), 0)`,
        deliveredAwaitingFinal: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'DELIVERED_AWAITING_FINAL_INVOICE' then 1 else 0 end), 0)`,
        completed: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'COMPLETED' then 1 else 0 end), 0)`,
        requiringAttention: sql<number>`coalesce(sum(case when ${deliveries.requiresAdminAttention} then 1 else 0 end), 0)`,
      })
      .from(deliveries)
      .innerJoin(installations, eq(deliveries.installationId, installations.id))
      .where(and(
        eq(deliveries.type, "FOR_INSTALLATION"),
        eq(installations.assignedInstallerId, filters.assignedInstallerId)
      ));

    const distributionRows = await db
      .select({
        stage: deliveries.stage,
        count: sql<number>`count(*)`,
      })
      .from(deliveries)
      .innerJoin(installations, eq(deliveries.installationId, installations.id))
      .where(and(
        eq(deliveries.type, "FOR_INSTALLATION"),
        eq(installations.assignedInstallerId, filters.assignedInstallerId)
      ))
      .groupBy(deliveries.stage);

    const recentRows = await db
      .select({
        id: deliveries.id,
        deliveryNumber: deliveries.deliveryNumber,
        stage: deliveries.stage,
        scheduledDate: deliveries.scheduledDate,
        installationId: deliveries.installationId,
        installationNumber: installations.installationNumber,
        installationStatus: installations.status,
        clientName: clients.fullName,
      })
      .from(deliveries)
      .innerJoin(installations, eq(deliveries.installationId, installations.id))
      .leftJoin(clients, eq(deliveries.clientId, clients.id))
      .where(and(
        eq(deliveries.type, "FOR_INSTALLATION"),
        eq(installations.assignedInstallerId, filters.assignedInstallerId)
      ))
      .orderBy(desc(deliveries.createdAt))
      .limit(limit);

    const metrics = {
      total: Number(metricsRow?.total ?? 0),
      scheduled: Number(metricsRow?.scheduled ?? 0),
      shippingOrdered: Number(metricsRow?.shippingOrdered ?? 0),
      deliveredAwaitingFinal: Number(metricsRow?.deliveredAwaitingFinal ?? 0),
      completed: Number(metricsRow?.completed ?? 0),
      requiringAttention: Number(metricsRow?.requiringAttention ?? 0),
    } as const;

    const recent = recentRows.map((row) => ({
      id: row.id,
      deliveryNumber: row.deliveryNumber,
      stage: row.stage,
      stageLabel: deliveryStageLabels[row.stage],
      scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
      installationId: row.installationId ?? null,
      installationNumber: row.installationNumber ?? null,
      installationStatus: row.installationStatus ?? null,
      clientName: row.clientName ?? null,
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

  // Bez filtrowania - oryginalna logika
  const [metricsRow] = await db
    .select({
      total: sql<number>`coalesce(count(*), 0)`,
      scheduled: sql<number>`coalesce(sum(case when ${deliveries.stage} in ('RECEIVED', 'PROFORMA_SENT_AWAITING_PAYMENT') then 1 else 0 end), 0)`,
      shippingOrdered: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'SHIPPING_ORDERED' then 1 else 0 end), 0)`,
      deliveredAwaitingFinal: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'DELIVERED_AWAITING_FINAL_INVOICE' then 1 else 0 end), 0)`,
      completed: sql<number>`coalesce(sum(case when ${deliveries.stage} = 'COMPLETED' then 1 else 0 end), 0)`,
      requiringAttention: sql<number>`coalesce(sum(case when ${deliveries.requiresAdminAttention} then 1 else 0 end), 0)`,
    })
    .from(deliveries)
    .where(eq(deliveries.type, "FOR_INSTALLATION"));

  const distributionRows = await db
    .select({
      stage: deliveries.stage,
      count: sql<number>`count(*)`,
    })
    .from(deliveries)
    .where(eq(deliveries.type, "FOR_INSTALLATION"))
    .groupBy(deliveries.stage);

  const recentRows = await db
    .select({
      id: deliveries.id,
      deliveryNumber: deliveries.deliveryNumber,
      stage: deliveries.stage,
      scheduledDate: deliveries.scheduledDate,
      installationId: deliveries.installationId,
      installationNumber: installations.installationNumber,
      installationStatus: installations.status,
      clientName: clients.fullName,
    })
    .from(deliveries)
    .leftJoin(installations, eq(deliveries.installationId, installations.id))
    .leftJoin(clients, eq(deliveries.clientId, clients.id))
    .where(eq(deliveries.type, "FOR_INSTALLATION"))
    .orderBy(desc(deliveries.createdAt))
    .limit(limit);

  const metrics = {
    total: Number(metricsRow?.total ?? 0),
    scheduled: Number(metricsRow?.scheduled ?? 0),
    shippingOrdered: Number(metricsRow?.shippingOrdered ?? 0),
    deliveredAwaitingFinal: Number(metricsRow?.deliveredAwaitingFinal ?? 0),
    completed: Number(metricsRow?.completed ?? 0),
    requiringAttention: Number(metricsRow?.requiringAttention ?? 0),
  } as const;

  const recent = recentRows.map((row) => ({
    id: row.id,
    deliveryNumber: row.deliveryNumber,
    stage: row.stage,
    stageLabel: deliveryStageLabels[row.stage],
    scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
    installationId: row.installationId ?? null,
    installationNumber: row.installationNumber ?? null,
    installationStatus: row.installationStatus ?? null,
    clientName: row.clientName ?? null,
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

export async function getInstallationDeliveriesList(limit = 30, filters?: InstallationDeliveriesFilters): Promise<InstallationDeliveryListItem[]> {
  let query = db
    .select({
      id: deliveries.id,
      deliveryNumber: deliveries.deliveryNumber,
      stage: deliveries.stage,
      scheduledDate: deliveries.scheduledDate,
      requiresAdminAttention: deliveries.requiresAdminAttention,
      installationId: deliveries.installationId,
      installationNumber: installations.installationNumber,
      installationStatus: installations.status,
      installationStart: installations.scheduledStartAt,
      installationEnd: installations.scheduledEndAt,
      orderId: deliveries.orderId,
      orderNumber: orders.orderNumber,
      clientName: clients.fullName,
    })
    .from(deliveries)
    .leftJoin(installations, eq(deliveries.installationId, installations.id))
    .leftJoin(orders, eq(deliveries.orderId, orders.id))
    .leftJoin(clients, eq(deliveries.clientId, clients.id));

  const whereCondition = filters?.assignedInstallerId
    ? and(
        eq(deliveries.type, "FOR_INSTALLATION"),
        eq(installations.assignedInstallerId, filters.assignedInstallerId),
      )
    : eq(deliveries.type, "FOR_INSTALLATION");

  query = query.where(whereCondition);

  const rows = await query
    .orderBy(desc(deliveries.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const installationStatusLabel = row.installationStatus
      ? installationStatusLabels[row.installationStatus]
      : null;
    const orderReference = row.orderNumber?.trim().length
      ? row.orderNumber
      : row.orderId?.slice(0, 6).toUpperCase() ?? null;

    return {
      id: row.id,
      deliveryNumber: row.deliveryNumber,
      stage: row.stage,
      stageLabel: deliveryStageLabels[row.stage],
      scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
      requiresAdminAttention: Boolean(row.requiresAdminAttention),
      installationId: row.installationId ?? null,
      installationNumber: row.installationNumber ?? null,
      installationStatus: row.installationStatus ?? null,
      installationStatusLabel,
      installationStart: row.installationStart ? new Date(row.installationStart) : null,
      installationEnd: row.installationEnd ? new Date(row.installationEnd) : null,
      orderId: row.orderId ?? null,
      orderReference,
      clientName: row.clientName ?? null,
    } satisfies InstallationDeliveryListItem;
  });
}

export async function getInstallationDeliveriesDashboardData(
  limit = 30,
  filters?: InstallationDeliveriesFilters,
): Promise<InstallationDeliveriesDashboardData> {
  const [snapshot, list] = await Promise.all([
    getInstallationDeliveriesSnapshot(limit, filters),
    getInstallationDeliveriesList(limit, filters),
  ]);

  return { snapshot, list };
}
