import { startOfMonth } from "date-fns";
import { asc, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@db/index";
import { clients, deliveries, installations, orders, partners, users } from "@db/schema";

import type {
  DeliveryStage,
  DeliveryType,
  InstallationStatus,
  OrderStage,
} from "@db/schema";
import { installationStatusLabels } from "@/lib/installations/constants";
import { deliveryStageLabels, deliveryTypeLabels } from "@/lib/deliveries";

const COMPLETED_STAGE: OrderStage = "COMPLETED";

export type ClientsMetrics = {
  totalClients: number;
  clientsWithOpenOrders: number;
  newThisMonth: number;
};

export type ClientsListItem = {
  id: string;
  clientNumber: number;
  fullName: string;
  city: string | null;
  partnerName: string | null;
  totalOrders: number;
  openOrders: number;
  lastOrderAt: Date | null;
  createdAt: Date;
};

export type ClientsDashboardData = {
  metrics: ClientsMetrics;
  clients: ClientsListItem[];
};

export type ClientOrderSummary = {
  id: string;
  orderNumber: string | null;
  title: string | null;
  stage: OrderStage;
  stageChangedAt: Date;
  requiresAdminAttention: boolean;
  declaredFloorArea: number | null;
  declaredBaseboardLength: number | null;
};

export type ClientInstallationSummary = {
  id: string;
  installationNumber: string;
  status: InstallationStatus;
  statusLabel: string;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  assignedInstallerName: string | null;
  requiresAdminAttention: boolean;
  orderId: string;
  orderReference: string;
  orderTitle: string | null;
};

export type ClientDeliverySummary = {
  id: string;
  deliveryNumber: string;
  stage: DeliveryStage;
  stageLabel: string;
  type: DeliveryType;
  typeLabel: string;
  scheduledDate: Date | null;
  requiresAdminAttention: boolean;
  orderId: string | null;
  orderReference: string | null;
  orderTitle: string | null;
  installationId: string | null;
};

export type ClientDetail = {
  client: {
    id: string;
    clientNumber: number;
    fullName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    street: string | null;
    postalCode: string | null;
    acquisitionSource: string | null;
    additionalInfo: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  partner: {
    id: string;
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } | null;
  stats: {
    totalOrders: number;
    openOrders: number;
    completedOrders: number;
    lastOrderAt: Date | null;
  };
  orders: ClientOrderSummary[];
  installations: ClientInstallationSummary[];
  deliveries: ClientDeliverySummary[];
};

function mapClientsList(rows: Array<{
  id: string;
  clientNumber: number;
  fullName: string;
  city: string | null;
  partnerName: string | null;
  totalOrders: number | null;
  openOrders: number | null;
  lastOrderAt: Date | null;
  createdAt: Date;
}>): ClientsListItem[] {
  return rows.map((row) => ({
    id: row.id,
    clientNumber: Number(row.clientNumber ?? 0),
    fullName: row.fullName,
    city: row.city,
    partnerName: row.partnerName,
    totalOrders: Number(row.totalOrders ?? 0),
    openOrders: Number(row.openOrders ?? 0),
    lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt) : null,
    createdAt: new Date(row.createdAt),
  }));
}

export async function getClientsDashboardData(limit = 100): Promise<ClientsDashboardData> {
  const monthStart = startOfMonth(new Date());

  const rows = await db
    .select({
      id: clients.id,
      clientNumber: clients.clientNumber,
      fullName: clients.fullName,
      city: clients.city,
      partnerName: partners.companyName,
      totalOrders: sql<number>`coalesce(count(${orders.id}), 0)`,
      openOrders: sql<number>`coalesce(sum(case when ${orders.stage} != ${COMPLETED_STAGE} then 1 else 0 end), 0)`,
      lastOrderAt: sql<Date | null>`max(${orders.stageChangedAt})`,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .leftJoin(orders, eq(orders.clientId, clients.id))
    .leftJoin(partners, eq(clients.partnerId, partners.id))
  .groupBy(clients.id, clients.clientNumber, partners.companyName, clients.fullName, clients.city, clients.createdAt)
    .orderBy(desc(sql`max(${orders.stageChangedAt})`), asc(clients.fullName))
    .limit(limit);

  const list = mapClientsList(rows);
  const metrics = list.reduce<ClientsMetrics>(
    (acc, client) => {
      acc.totalClients += 1;
      if (client.openOrders > 0) {
        acc.clientsWithOpenOrders += 1;
      }
      if (client.createdAt >= monthStart) {
        acc.newThisMonth += 1;
      }
      return acc;
    },
    { totalClients: 0, clientsWithOpenOrders: 0, newThisMonth: 0 }
  );

  return {
    metrics,
    clients: list,
  };
}

export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const base = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
    with: {
      partner: true,
      orders: {
        columns: {
          id: true,
          orderNumber: true,
          title: true,
          stage: true,
          stageChangedAt: true,
          requiresAdminAttention: true,
          declaredFloorArea: true,
          declaredBaseboardLength: true,
        },
        orderBy: (ordersTable, { desc }) => [desc(ordersTable.stageChangedAt)],
      },
    },
  });

  if (!base) {
    return null;
  }

  const ordersSummary: ClientOrderSummary[] = (base.orders ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    title: order.title,
    stage: order.stage,
    stageChangedAt: new Date(order.stageChangedAt),
    requiresAdminAttention: order.requiresAdminAttention,
    declaredFloorArea: order.declaredFloorArea,
    declaredBaseboardLength: order.declaredBaseboardLength,
  }));

  const totalOrders = ordersSummary.length;
  const completedOrders = ordersSummary.filter((order) => order.stage === COMPLETED_STAGE).length;
  const openOrders = totalOrders - completedOrders;
  const lastOrderAt = ordersSummary[0]?.stageChangedAt ?? null;

  const installationRows = await db
    .select({
      id: installations.id,
      installationNumber: installations.installationNumber,
      status: installations.status,
      scheduledStartAt: installations.scheduledStartAt,
      scheduledEndAt: installations.scheduledEndAt,
      requiresAdminAttention: installations.requiresAdminAttention,
      orderId: installations.orderId,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      assignedInstallerName: users.name,
      assignedInstallerUsername: users.username,
      createdAt: installations.createdAt,
    })
    .from(installations)
    .leftJoin(orders, eq(installations.orderId, orders.id))
    .leftJoin(users, eq(installations.assignedInstallerId, users.id))
    .where(eq(orders.clientId, clientId))
    .orderBy(desc(installations.createdAt))
    .limit(6);

  const installationsSummary: ClientInstallationSummary[] = installationRows.map((row) => {
    const orderReference = row.orderNumber?.trim().length
      ? row.orderNumber.trim()
      : row.orderId.slice(0, 6).toUpperCase();

    return {
      id: row.id,
      installationNumber: row.installationNumber,
      status: row.status,
      statusLabel: installationStatusLabels[row.status],
      scheduledStartAt: row.scheduledStartAt ? new Date(row.scheduledStartAt) : null,
      scheduledEndAt: row.scheduledEndAt ? new Date(row.scheduledEndAt) : null,
      assignedInstallerName: row.assignedInstallerName ?? row.assignedInstallerUsername ?? null,
      requiresAdminAttention: Boolean(row.requiresAdminAttention),
      orderId: row.orderId,
      orderReference,
      orderTitle: row.orderTitle ?? null,
    };
  });

  const deliveryRows = await db
    .select({
      id: deliveries.id,
      deliveryNumber: deliveries.deliveryNumber,
      stage: deliveries.stage,
      type: deliveries.type,
      scheduledDate: deliveries.scheduledDate,
      requiresAdminAttention: deliveries.requiresAdminAttention,
      orderId: deliveries.orderId,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      installationId: deliveries.installationId,
      createdAt: deliveries.createdAt,
    })
    .from(deliveries)
    .leftJoin(orders, eq(deliveries.orderId, orders.id))
    .where(eq(deliveries.clientId, clientId))
    .orderBy(desc(deliveries.createdAt))
    .limit(6);

  const deliveriesSummary: ClientDeliverySummary[] = deliveryRows.map((row) => {
    const orderReference = row.orderNumber?.trim().length
      ? row.orderNumber.trim()
      : row.orderId
        ? row.orderId.slice(0, 6).toUpperCase()
        : null;

    return {
      id: row.id,
      deliveryNumber: row.deliveryNumber,
      stage: row.stage,
      stageLabel: deliveryStageLabels[row.stage],
      type: row.type,
      typeLabel: deliveryTypeLabels[row.type],
      scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null,
      requiresAdminAttention: Boolean(row.requiresAdminAttention),
      orderId: row.orderId ?? null,
      orderReference,
      orderTitle: row.orderTitle ?? null,
      installationId: row.installationId ?? null,
    };
  });

  return {
    client: {
      id: base.id,
      clientNumber: base.clientNumber,
      fullName: base.fullName,
      email: base.email,
      phone: base.phone,
      city: base.city,
      street: base.street,
      postalCode: base.postalCode,
      acquisitionSource: base.acquisitionSource,
      additionalInfo: base.additionalInfo,
      createdAt: new Date(base.createdAt),
      updatedAt: new Date(base.updatedAt),
    },
    partner: base.partner
      ? {
          id: base.partner.id,
          companyName: base.partner.companyName,
          contactName: base.partner.contactName,
          contactEmail: base.partner.contactEmail,
          contactPhone: base.partner.contactPhone,
        }
      : null,
    stats: {
      totalOrders,
      openOrders,
      completedOrders,
      lastOrderAt,
    },
    orders: ordersSummary,
    installations: installationsSummary,
    deliveries: deliveriesSummary,
  };
}

export type ClientSelectOption = {
  id: string;
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
};

export async function listClientsForSelect(): Promise<ClientSelectOption[]> {
  const rows = await db
    .select({
      id: clients.id,
      clientNumber: clients.clientNumber,
      fullName: clients.fullName,
      city: clients.city,
      street: clients.street,
      postalCode: clients.postalCode,
    })
    .from(clients)
    .orderBy(asc(clients.fullName));

  return rows.map((row) => {
    const baseLabel = row.city ? `${row.fullName} · ${row.city}` : row.fullName;
    return {
      id: row.id,
      label: `#${row.clientNumber} — ${baseLabel}`,
      street: row.street ?? null,
      city: row.city ?? null,
      postalCode: row.postalCode ?? null,
    };
  });
}

export type CreateClientInput = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  street?: string | null;
  postalCode?: string | null;
  acquisitionSource?: string | null;
  additionalInfo?: string | null;
  partnerId?: string | null;
};

export async function createClient(payload: CreateClientInput) {
  const trimmedName = payload.fullName.trim();
  if (!trimmedName) {
    throw new Error("Nazwa klienta jest wymagana.");
  }

  const result = db.transaction((tx) => {
    const maxRow = tx
      .select({ value: sql<number>`coalesce(max(${clients.clientNumber}), -1)` })
      .from(clients)
      .get();

    const nextNumber = Number(maxRow?.value ?? -1) + 1;
    const now = new Date();

    const record: typeof clients.$inferInsert = {
      clientNumber: nextNumber,
      fullName: trimmedName,
      partnerId: payload.partnerId ?? null,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      city: payload.city?.trim() || null,
      street: payload.street?.trim() || null,
      postalCode: payload.postalCode?.trim() || null,
      acquisitionSource: payload.acquisitionSource?.trim() || null,
      additionalInfo: payload.additionalInfo?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    const created = tx.insert(clients).values(record).returning().get();

    if (!created) {
      throw new Error("Nie udało się utworzyć klienta.");
    }

    return created;
  });

  return result;
}

export async function getClientTotals() {
  const rows = await db
    .select({
      totalClients: count(clients.id),
      openOrders: sql<number>`coalesce(sum(case when ${orders.stage} != ${COMPLETED_STAGE} then 1 else 0 end), 0)`,
    })
    .from(clients)
    .leftJoin(orders, eq(orders.clientId, clients.id));

  const row = rows[0];

  return {
    totalClients: Number(row?.totalClients ?? 0),
    openOrders: Number(row?.openOrders ?? 0),
  };
}
