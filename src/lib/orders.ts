 import { subDays } from "date-fns";
import { and, count, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";

import { db } from "@db/index";
import {
  clients,
  deliveries,
  installations,
  measurements,
  orderStatusHistory,
  orders,
  orderStages,
  partners,
  tasks,
  type OrderStage,
  type OrderExecutionMode,
  type TaskStatus,
} from "@db/schema";
import { installationStatusLabels } from "@/lib/installations";
import { deliveryStageLabels } from "@/lib/deliveries";
import type { CreateOrderInput } from "@/lib/orders/schemas";

export type OrdersMetrics = {
  totalOrders: number;
  requiringAttention: number;
  newThisWeek: number;
  scheduledInstallations: number;
  totalDeclaredFloorArea: number;
};

export type StageDistributionEntry = {
  stage: OrderStage;
  count: number;
};

export type OrdersListItem = {
  id: string;
  orderNumber: string | null;
  title: string | null;
  clientName: string;
  clientCity: string | null;
  partnerName: string | null;
  stage: OrderStage;
  executionMode: OrderExecutionMode;
  stageNotes: string | null;
  stageChangedAt: Date;
  declaredFloorArea: number | null;
  declaredBaseboardLength: number | null;
  requiresAdminAttention: boolean;
  pendingTasks: number;
  scheduledInstallationDate: Date | null;
  scheduledDeliveryDate: Date | null;
  createdAt: Date;
};

const taskStatusesRequiringAttention: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED"];

const emptyStageDistribution: StageDistributionEntry[] = orderStages.map((stage) => ({
  stage,
  count: 0,
}));

export type OrdersFilters = {
  assignedInstallerId?: string;
  clientId?: string;
  partnerId?: string;
};

export async function getOrdersMetrics(filters?: OrdersFilters): Promise<OrdersMetrics> {
  const weekAgo = subDays(new Date(), 7);

  // Dla assignedInstallerId: JOIN z measurements i installations (OR)
  if (filters?.assignedInstallerId) {
    const installerCondition = sql`(${measurements.assignedMeasurerId} = ${filters.assignedInstallerId} OR ${installations.assignedInstallerId} = ${filters.assignedInstallerId})`;
    
    const additionalFilters = [];
    if (filters.clientId) {
      additionalFilters.push(eq(orders.clientId, filters.clientId));
    }
    if (filters.partnerId) {
      additionalFilters.push(eq(orders.partnerId, filters.partnerId));
    }
    
    const baseWhere = additionalFilters.length > 0 
      ? and(installerCondition, ...additionalFilters)
      : installerCondition;

    const [totalResult, requiringAttentionResult, newThisWeekResult, upcomingInstallationsResult, totalAreaResult] =
      await Promise.all([
        db
          .select({ value: sql<number>`count(distinct ${orders.id})` })
          .from(orders)
          .leftJoin(measurements, eq(measurements.orderId, orders.id))
          .leftJoin(installations, eq(installations.orderId, orders.id))
          .where(baseWhere),
        db
          .select({ value: sql<number>`count(distinct ${orders.id})` })
          .from(orders)
          .leftJoin(measurements, eq(measurements.orderId, orders.id))
          .leftJoin(installations, eq(installations.orderId, orders.id))
          .where(and(baseWhere, eq(orders.requiresAdminAttention, true))),
        db
          .select({ value: sql<number>`count(distinct ${orders.id})` })
          .from(orders)
          .leftJoin(measurements, eq(measurements.orderId, orders.id))
          .leftJoin(installations, eq(installations.orderId, orders.id))
          .where(and(baseWhere, gt(orders.createdAt, weekAgo))),
        db
          .select({ value: count() })
          .from(installations)
          .where(
            and(
              eq(installations.assignedInstallerId, filters.assignedInstallerId),
              eq(installations.status, "SCHEDULED"),
              gt(installations.scheduledStartAt, new Date())
            )
          ),
        db
          .select({
            value: sql<number>`coalesce(sum(distinct ${orders.declaredFloorArea}), 0)`
          })
          .from(orders)
          .leftJoin(measurements, eq(measurements.orderId, orders.id))
          .leftJoin(installations, eq(installations.orderId, orders.id))
          .where(baseWhere),
      ]);

    return {
      totalOrders: Number(totalResult[0]?.value ?? 0),
      requiringAttention: Number(requiringAttentionResult[0]?.value ?? 0),
      newThisWeek: Number(newThisWeekResult[0]?.value ?? 0),
      scheduledInstallations: upcomingInstallationsResult[0]?.value ?? 0,
      totalDeclaredFloorArea: totalAreaResult[0]?.value ?? 0,
    };
  }

  // Standardowe filtrowanie bez assignedInstallerId
  const filterConditions = [];
  if (filters?.clientId) {
    filterConditions.push(eq(orders.clientId, filters.clientId));
  }
  if (filters?.partnerId) {
    filterConditions.push(eq(orders.partnerId, filters.partnerId));
  }

  const baseWhere = filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const [totalResult, requiringAttentionResult, newThisWeekResult, upcomingInstallationsResult, totalAreaResult] =
    await Promise.all([
      db.select({ value: count() }).from(orders).where(baseWhere),
      db
        .select({ value: count() })
        .from(orders)
        .where(baseWhere ? and(baseWhere, eq(orders.requiresAdminAttention, true)) : eq(orders.requiresAdminAttention, true)),
      db
        .select({ value: count() })
        .from(orders)
        .where(baseWhere ? and(baseWhere, gt(orders.createdAt, weekAgo)) : gt(orders.createdAt, weekAgo)),
      db
        .select({ value: count() })
        .from(installations)
        .where(
          filters?.assignedInstallerId
            ? and(
                eq(installations.assignedInstallerId, filters.assignedInstallerId),
                eq(installations.status, "SCHEDULED"),
                gt(installations.scheduledStartAt, new Date())
              )
            : and(
                eq(installations.status, "SCHEDULED"),
                gt(installations.scheduledStartAt, new Date())
              )
        ),
      db
        .select({
          value: sql<number>`coalesce(sum(${orders.declaredFloorArea}), 0)`
        })
        .from(orders)
        .where(baseWhere),
    ]);

  return {
    totalOrders: totalResult[0]?.value ?? 0,
    requiringAttention: requiringAttentionResult[0]?.value ?? 0,
    newThisWeek: newThisWeekResult[0]?.value ?? 0,
    scheduledInstallations: upcomingInstallationsResult[0]?.value ?? 0,
    totalDeclaredFloorArea: totalAreaResult[0]?.value ?? 0,
  };
}

export async function getStageDistribution(filters?: OrdersFilters): Promise<StageDistributionEntry[]> {
  // Dla assignedInstallerId: musimy JOIN z measurements i installations (OR)
  if (filters?.assignedInstallerId) {
    const filterConditions = [
      sql`(${measurements.assignedMeasurerId} = ${filters.assignedInstallerId} OR ${installations.assignedInstallerId} = ${filters.assignedInstallerId})`
    ];
    
    if (filters.clientId) {
      filterConditions.push(eq(orders.clientId, filters.clientId));
    }
    if (filters.partnerId) {
      filterConditions.push(eq(orders.partnerId, filters.partnerId));
    }

    const rows = await db
      .select({
        stage: orders.stage,
        count: sql<number>`count(distinct ${orders.id})`,
      })
      .from(orders)
      .leftJoin(measurements, eq(measurements.orderId, orders.id))
      .leftJoin(installations, eq(installations.orderId, orders.id))
      .where(and(...filterConditions))
      .groupBy(orders.stage)
      .orderBy(orders.stage);

    if (!rows.length) {
      return emptyStageDistribution;
    }

    const resultMap = new Map<OrderStage, number>();
    for (const entry of rows) {
      resultMap.set(entry.stage, entry.count ?? 0);
    }

    return emptyStageDistribution.map((item) => ({
      stage: item.stage,
      count: resultMap.get(item.stage) ?? 0,
    }));
  }
  
  // Standardowe filtrowanie bez assignedInstallerId
  const filterConditions = [];
  if (filters?.clientId) {
    filterConditions.push(eq(orders.clientId, filters.clientId));
  }
  if (filters?.partnerId) {
    filterConditions.push(eq(orders.partnerId, filters.partnerId));
  }

  const baseWhere = filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const rows = await db
    .select({
      stage: orders.stage,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(baseWhere)
    .groupBy(orders.stage)
    .orderBy(orders.stage);

  if (!rows.length) {
    return emptyStageDistribution;
  }

  const resultMap = new Map<OrderStage, number>();
  for (const entry of rows) {
    resultMap.set(entry.stage, entry.count ?? 0);
  }

  return emptyStageDistribution.map((item) => ({
    stage: item.stage,
    count: resultMap.get(item.stage) ?? 0,
  }));
}

export async function getOrdersList(limit = 20, filters?: OrdersFilters): Promise<OrdersListItem[]> {
  // Buduj warunki filtrowania - dla assignedInstallerId filtrujemy przez measurements OR installations
  const filterConditions = [];
  
  // Inne filtry bezpośrednio na orders
  if (filters?.clientId) {
    filterConditions.push(eq(orders.clientId, filters.clientId));
  }
  if (filters?.partnerId) {
    filterConditions.push(eq(orders.partnerId, filters.partnerId));
  }

  const baseWhere = filterConditions.length > 0 ? and(...filterConditions) : undefined;
  
  // Dla assignedInstallerId: filtr przez measurements OR installations
  const installerFilter = filters?.assignedInstallerId
    ? sql`(${measurements.assignedMeasurerId} = ${filters.assignedInstallerId} OR ${installations.assignedInstallerId} = ${filters.assignedInstallerId})`
    : undefined;
  
  const finalWhere = baseWhere && installerFilter
    ? and(baseWhere, installerFilter)
    : baseWhere ?? installerFilter;

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      title: orders.title,
      clientName: clients.fullName,
      clientCity: clients.city,
      partnerName: partners.companyName,
      stage: orders.stage,
      executionMode: orders.executionMode,
      stageNotes: orders.stageNotes,
      stageChangedAt: orders.stageChangedAt,
      declaredFloorArea: orders.declaredFloorArea,
      declaredBaseboardLength: orders.declaredBaseboardLength,
      requiresAdminAttention: orders.requiresAdminAttention,
      pendingTasks: sql<number>`coalesce(sum(case when ${inArray(
        tasks.status,
        taskStatusesRequiringAttention
      )} then 1 else 0 end), 0)`,
      scheduledInstallationDate: sql<Date | null>`min(${installations.scheduledStartAt})`,
      scheduledDeliveryDate: sql<Date | null>`min(${deliveries.scheduledDate})`,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(partners, eq(orders.partnerId, partners.id))
    .leftJoin(tasks, eq(tasks.relatedOrderId, orders.id))
    .leftJoin(measurements, eq(measurements.orderId, orders.id))
    .leftJoin(installations, eq(installations.orderId, orders.id))
    .leftJoin(deliveries, eq(deliveries.orderId, orders.id))
    .where(finalWhere)
    .orderBy(desc(orders.stageChangedAt))
    .groupBy(
      orders.id,
      orders.orderNumber,
      orders.title,
      clients.fullName,
      clients.city,
      partners.companyName,
      orders.stage,
      orders.executionMode,
      orders.stageNotes,
      orders.stageChangedAt,
      orders.declaredFloorArea,
      orders.declaredBaseboardLength,
      orders.requiresAdminAttention,
      orders.createdAt
    )
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber ?? null,
    title: row.title ?? null,
    clientName: row.clientName ?? "Klient nieznany",
    clientCity: row.clientCity,
    partnerName: row.partnerName,
    stage: row.stage,
    executionMode: row.executionMode,
    stageNotes: row.stageNotes,
    stageChangedAt: row.stageChangedAt,
    declaredFloorArea: row.declaredFloorArea,
    declaredBaseboardLength: row.declaredBaseboardLength,
    requiresAdminAttention: row.requiresAdminAttention,
    pendingTasks: Number(row.pendingTasks ?? 0),
    scheduledInstallationDate: row.scheduledInstallationDate ?? null,
    scheduledDeliveryDate: row.scheduledDeliveryDate ?? null,
    createdAt: row.createdAt,
  }));
}

export async function getOrdersDashboardData(limit = 20, filters?: OrdersFilters) {
  const [metrics, stageDistribution, ordersList] = await Promise.all([
    getOrdersMetrics(filters),
    getStageDistribution(filters),
    getOrdersList(limit, filters),
  ]);

  return {
    metrics,
    stageDistribution,
    orders: ordersList,
  };
}

const isFutureDate = (value: Date | null | undefined): value is Date => {
  return Boolean(value && value.getTime() > Date.now());
};

export async function getOrderDetail(orderId: string) {
  const orderRecord = await db.query.orders.findFirst({
    where: (table, { eq }) => eq(table.id, orderId),
    with: {
      client: true,
      partner: true,
      owner: true,
      assignedInstaller: true,
      preferredPanelProduct: true,
      preferredBaseboardProduct: true,
      measurements: {
        with: {
          attachments: true,
          adjustments: true,
          panelProduct: true,
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      },
      installations: {
        with: {
          attachments: true,
          panelProduct: true,
          baseboardProduct: true,
          assignedInstaller: true,
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      },
      deliveries: {
        with: {
          attachments: true,
          panelProduct: true,
          baseboardProduct: true,
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      },
      tasks: {
        with: {
          assignedTo: true,
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      },
      attachments: true,
      statusHistory: {
        with: {
          changedBy: true,
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      },
    },
  });

  if (!orderRecord) {
    return null;
  }

  const measurementAttachmentCount = orderRecord.measurements.reduce(
    (acc, measurement) => acc + (measurement.attachments?.length ?? 0),
    0
  );
  const installationAttachmentCount = orderRecord.installations.reduce(
    (acc, installation) => acc + (installation.attachments?.length ?? 0),
    0
  );
  const deliveryAttachmentCount = orderRecord.deliveries.reduce(
    (acc, delivery) => acc + (delivery.attachments?.length ?? 0),
    0
  );
  const ownAttachmentCount = orderRecord.attachments?.length ?? 0;

  const pendingTaskCount = orderRecord.tasks.filter((task) =>
    taskStatusesRequiringAttention.includes(task.status)
  ).length;
  const closedTaskCount = orderRecord.tasks.filter((task) => task.status === "DONE").length;

  const upcomingInstallationDate = orderRecord.installations
    .map((installation) => installation.scheduledStartAt)
    .filter(isFutureDate)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  const installationChecklist = {
    quoteSent: Boolean(orderRecord.quoteSent),
    depositInvoiceIssued: Boolean(orderRecord.depositInvoiceIssued),
    finalInvoiceIssued: Boolean(orderRecord.finalInvoiceIssued),
    measurementCompleted: orderRecord.measurements.some((measurement) => Boolean(measurement.measuredAt)),
    handoverProtocolSigned: orderRecord.installations.some((installation) => installation.handoverProtocolSigned),
    reviewReceived: orderRecord.installations.some((installation) => installation.reviewReceived),
  } as const;

  const deliveryChecklist = {
    proformaIssued: orderRecord.deliveries.some((delivery) => delivery.proformaIssued),
    depositOrFinalInvoiceIssued: orderRecord.deliveries.some((delivery) => delivery.depositOrFinalInvoiceIssued),
    shippingOrdered: orderRecord.deliveries.some((delivery) => delivery.shippingOrdered),
    reviewReceived: orderRecord.deliveries.some((delivery) => delivery.reviewReceived),
  } as const;

  return {
    order: {
      id: orderRecord.id,
      clientId: orderRecord.clientId,
      partnerId: orderRecord.partnerId ?? null,
      ownerId: orderRecord.ownerId ?? null,
      ownerName: orderRecord.owner?.name ?? orderRecord.owner?.username ?? null,
      ownerEmail: orderRecord.owner?.email ?? null,
      ownerPhone: orderRecord.owner?.phone ?? null,
      assignedInstallerId: orderRecord.assignedInstallerId ?? null,
      assignedInstallerName: orderRecord.assignedInstaller?.name ?? orderRecord.assignedInstaller?.username ?? null,
      assignedInstallerEmail: orderRecord.assignedInstaller?.email ?? null,
      assignedInstallerPhone: orderRecord.assignedInstaller?.phone ?? null,
      orderNumber: orderRecord.orderNumber ?? null,
      title: orderRecord.title ?? null,
      executionMode: orderRecord.executionMode as OrderExecutionMode,
      stage: orderRecord.stage,
      stageNotes: orderRecord.stageNotes,
      stageChangedAt: orderRecord.stageChangedAt,
      requiresAdminAttention: orderRecord.requiresAdminAttention,
      declaredFloorArea: orderRecord.declaredFloorArea,
      declaredBaseboardLength: orderRecord.declaredBaseboardLength,
      buildingType: orderRecord.buildingType,
      panelPreference: orderRecord.panelPreference,
      baseboardPreference: orderRecord.baseboardPreference,
      preferredPanelProductId: orderRecord.preferredPanelProductId ?? null,
      preferredPanelProductName: orderRecord.preferredPanelProduct?.name ?? null,
      preferredBaseboardProductId: orderRecord.preferredBaseboardProductId ?? null,
      preferredBaseboardProductName: orderRecord.preferredBaseboardProduct?.name ?? null,
      quoteSent: Boolean(orderRecord.quoteSent),
      depositInvoiceIssued: Boolean(orderRecord.depositInvoiceIssued),
      finalInvoiceIssued: Boolean(orderRecord.finalInvoiceIssued),
      createdAt: orderRecord.createdAt,
      updatedAt: orderRecord.updatedAt,
    },
    client: orderRecord.client
      ? {
          id: orderRecord.client.id,
          fullName: orderRecord.client.fullName,
          phone: orderRecord.client.phone ?? null,
          email: orderRecord.client.email ?? null,
          city: orderRecord.client.city ?? null,
          street: orderRecord.client.street ?? null,
          postalCode: orderRecord.client.postalCode ?? null,
        }
      : null,
    partner: orderRecord.partner
      ? {
          id: orderRecord.partner.id,
          companyName: orderRecord.partner.companyName,
          contactName: orderRecord.partner.contactName ?? null,
          contactEmail: orderRecord.partner.contactEmail ?? null,
          contactPhone: orderRecord.partner.contactPhone ?? null,
        }
      : null,
    summary: {
      openTaskCount: pendingTaskCount,
      closedTaskCount,
      totalAttachments: ownAttachmentCount + measurementAttachmentCount + installationAttachmentCount + deliveryAttachmentCount,
      totalMeasurements: orderRecord.measurements.length,
      totalDeliveries: orderRecord.deliveries.length,
      upcomingInstallationDate,
    },
    checklists: {
      installation: installationChecklist,
      delivery: deliveryChecklist,
    },
    measurements: orderRecord.measurements.map((measurement) => ({
      id: measurement.id,
      scheduledAt: measurement.scheduledAt,
      measuredAt: measurement.measuredAt,
      measuredFloorArea: measurement.measuredFloorArea,
      measuredBaseboardLength: measurement.measuredBaseboardLength,
      offcutPercent: measurement.offcutPercent,
      deliveryTimingType: measurement.deliveryTimingType,
      deliveryDaysBefore: measurement.deliveryDaysBefore,
      deliveryDate: measurement.deliveryDate,
      panelProductName: measurement.panelProduct?.name ?? null,
      additionalNotes: measurement.additionalNotes,
      adjustmentsCount: measurement.adjustments?.length ?? 0,
      attachmentsCount: measurement.attachments?.length ?? 0,
      createdAt: measurement.createdAt,
    })),
    installations: orderRecord.installations.map((installation) => ({
      id: installation.id,
      installationNumber: installation.installationNumber,
      status: installation.status,
      statusLabel: installationStatusLabels[installation.status],
      scheduledStartAt: installation.scheduledStartAt,
      scheduledEndAt: installation.scheduledEndAt,
      actualStartAt: installation.actualStartAt,
      actualEndAt: installation.actualEndAt,
      assignedInstallerId: installation.assignedInstallerId ?? null,
      assignedInstallerName: installation.assignedInstaller?.name ?? installation.assignedInstaller?.username ?? null,
      addressStreet: installation.addressStreet ?? null,
      addressCity: installation.addressCity ?? null,
      addressPostalCode: installation.addressPostalCode ?? null,
      clientPhone: orderRecord.client?.phone ?? null,
      panelProductName: installation.panelProduct?.name ?? null,
      baseboardProductName: installation.baseboardProduct?.name ?? null,
      additionalWork: installation.additionalWork,
      additionalInfo: installation.additionalInfo,
      attachmentsCount: installation.attachments?.length ?? 0,
      handoverProtocolSigned: Boolean(installation.handoverProtocolSigned),
      reviewReceived: Boolean(installation.reviewReceived),
      requiresAdminAttention: Boolean(installation.requiresAdminAttention),
      createdAt: installation.createdAt,
    })),
    deliveries: orderRecord.deliveries.map((delivery) => ({
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      type: delivery.type,
      stage: delivery.stage,
      stageLabel: deliveryStageLabels[delivery.stage],
      scheduledDate: delivery.scheduledDate,
      includePanels: Boolean(delivery.includePanels),
      includeBaseboards: Boolean(delivery.includeBaseboards),
      panelProductName: delivery.panelProduct?.name ?? null,
      baseboardProductName: delivery.baseboardProduct?.name ?? null,
      shippingAddressStreet: delivery.shippingAddressStreet ?? null,
      shippingAddressCity: delivery.shippingAddressCity ?? null,
      shippingAddressPostalCode: delivery.shippingAddressPostalCode ?? null,
      proformaIssued: Boolean(delivery.proformaIssued),
      depositOrFinalInvoiceIssued: Boolean(delivery.depositOrFinalInvoiceIssued),
      shippingOrdered: Boolean(delivery.shippingOrdered),
      reviewReceived: Boolean(delivery.reviewReceived),
      notes: delivery.notes,
      attachmentsCount: delivery.attachments?.length ?? 0,
      requiresAdminAttention: Boolean(delivery.requiresAdminAttention),
      createdAt: delivery.createdAt,
    })),
    tasks: orderRecord.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedToName: task.assignedTo?.name ?? task.assignedTo?.username ?? null,
      createdAt: task.createdAt,
    })),
    statusHistory: orderRecord.statusHistory.map((entry) => ({
      id: entry.id,
      fromStage: entry.fromStage ?? null,
      toStage: entry.toStage,
      note: entry.note,
      changedAt: entry.createdAt,
      changedByName: entry.changedBy?.name ?? entry.changedBy?.username ?? null,
    })),
    attachments: (orderRecord.attachments ?? []).map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      description: file.description ?? null,
      contentType: file.contentType ?? null,
      createdAt: file.createdAt,
    })),
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;

const normalizeText = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function createOrder(payload: CreateOrderInput, createdById: string | null) {
  return db.transaction((tx) => {
    const now = new Date();

    const clientRecord = tx
      .select({ clientNumber: clients.clientNumber })
      .from(clients)
      .where(eq(clients.id, payload.clientId))
      .get();

    if (!clientRecord) {
      throw new Error("Nie znaleziono klienta dla wybranego zlecenia.");
    }

    let generatedOrderNumber = normalizeText(payload.orderNumber ?? null);

    if (!generatedOrderNumber) {
      const countRow = tx
        .select({ value: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.clientId, payload.clientId))
        .get();

      const nextSequence = Number(countRow?.value ?? 0) + 1;
      generatedOrderNumber = `${clientRecord.clientNumber}_Z_${nextSequence}`;
    }

    const record: typeof orders.$inferInsert = {
      clientId: payload.clientId,
      partnerId: payload.partnerId ?? null,
      orderNumber: generatedOrderNumber,
      title: payload.title ?? null,
      createdById: createdById ?? null,
      ownerId: payload.ownerId ?? null,
      assignedInstallerId: payload.assignedInstallerId ?? null,
      stage: payload.stage,
      executionMode: payload.executionMode,
      stageNotes: normalizeText(payload.stageNotes ?? null),
      stageChangedAt: now,
      declaredFloorArea: payload.declaredFloorArea ?? null,
      declaredBaseboardLength: payload.declaredBaseboardLength ?? null,
      buildingType: normalizeText(payload.buildingType ?? null),
      panelPreference: normalizeText(payload.panelPreference ?? null),
      baseboardPreference: normalizeText(payload.baseboardPreference ?? null),
      preferredPanelProductId: payload.preferredPanelProductId ?? null,
      preferredBaseboardProductId: payload.preferredBaseboardProductId ?? null,
      requiresAdminAttention: payload.requiresAdminAttention,
      quoteSent: payload.quoteSent,
      depositInvoiceIssued: payload.depositInvoiceIssued,
      finalInvoiceIssued: payload.finalInvoiceIssued,
      createdAt: now,
      updatedAt: now,
    };

    const created = tx.insert(orders).values(record).returning().get();

    if (!created) {
      throw new Error("Nie udało się utworzyć zlecenia.");
    }

    tx.insert(orderStatusHistory).values({
      orderId: created.id,
      changedById: createdById,
      fromStage: null,
      toStage: created.stage,
      note: created.stageNotes,
      createdAt: now,
    }).run();

    // Uwaga: Synchronizacja montera do montaży nastąpi gdy montaż zostanie utworzony
    // lub gdy zlecenie zostanie edytowane (patrz updateOrder)

    return created;
  });
}

export type OrderForEditing = {
  id: string;
  clientId: string;
  partnerId: string | null;
  ownerId: string | null;
  assignedInstallerId: string | null;
  orderNumber: string | null;
  title: string | null;
  executionMode: OrderExecutionMode;
  stage: OrderStage;
  stageNotes: string | null;
  declaredFloorArea: number | null;
  declaredBaseboardLength: number | null;
  buildingType: string | null;
  panelPreference: string | null;
  baseboardPreference: string | null;
  preferredPanelProductId: string | null;
  preferredBaseboardProductId: string | null;
  requiresAdminAttention: boolean;
  quoteSent: boolean;
  depositInvoiceIssued: boolean;
  finalInvoiceIssued: boolean;
};

export async function getOrderForEditing(orderId: string): Promise<OrderForEditing | null> {
  const row = await db.query.orders.findFirst({
    where: (table, { eq }) => eq(table.id, orderId),
    columns: {
      id: true,
      clientId: true,
      partnerId: true,
      ownerId: true,
  assignedInstallerId: true,
      orderNumber: true,
      title: true,
  executionMode: true,
      stage: true,
      stageNotes: true,
      declaredFloorArea: true,
      declaredBaseboardLength: true,
      buildingType: true,
      panelPreference: true,
      baseboardPreference: true,
      preferredPanelProductId: true,
      preferredBaseboardProductId: true,
      requiresAdminAttention: true,
      quoteSent: true,
      depositInvoiceIssued: true,
      finalInvoiceIssued: true,
      updatedAt: true,
      stageChangedAt: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    clientId: row.clientId,
    partnerId: row.partnerId ?? null,
    ownerId: row.ownerId ?? null,
  assignedInstallerId: row.assignedInstallerId ?? null,
    orderNumber: row.orderNumber ?? null,
    title: row.title ?? null,
    stage: row.stage,
  executionMode: row.executionMode,
    stageNotes: row.stageNotes ?? null,
    declaredFloorArea: row.declaredFloorArea ?? null,
    declaredBaseboardLength: row.declaredBaseboardLength ?? null,
    buildingType: row.buildingType ?? null,
    panelPreference: row.panelPreference ?? null,
    baseboardPreference: row.baseboardPreference ?? null,
    preferredPanelProductId: row.preferredPanelProductId ?? null,
    preferredBaseboardProductId: row.preferredBaseboardProductId ?? null,
    requiresAdminAttention: Boolean(row.requiresAdminAttention),
    quoteSent: Boolean(row.quoteSent),
    depositInvoiceIssued: Boolean(row.depositInvoiceIssued),
    finalInvoiceIssued: Boolean(row.finalInvoiceIssued),
  };
}

export async function updateOrder(
  orderId: string,
  payload: CreateOrderInput,
  updatedById: string | null,
): Promise<typeof orders.$inferSelect> {
  return db.transaction((tx) => {
    const existing = tx
      .select({
        id: orders.id,
        stage: orders.stage,
        stageChangedAt: orders.stageChangedAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    if (!existing) {
      throw new Error("Nie znaleziono zlecenia do aktualizacji.");
    }

    const now = new Date();
    const stageChanged = existing.stage !== payload.stage;

    const record: Partial<typeof orders.$inferInsert> = {
      clientId: payload.clientId,
      partnerId: payload.partnerId ?? null,
      ownerId: payload.ownerId ?? null,
      assignedInstallerId: payload.assignedInstallerId ?? null,
      orderNumber: normalizeText(payload.orderNumber ?? null),
      title: normalizeText(payload.title ?? null),
      stage: payload.stage,
      executionMode: payload.executionMode,
      stageNotes: normalizeText(payload.stageNotes ?? null),
      declaredFloorArea: payload.declaredFloorArea ?? null,
      declaredBaseboardLength: payload.declaredBaseboardLength ?? null,
      buildingType: normalizeText(payload.buildingType ?? null),
      panelPreference: normalizeText(payload.panelPreference ?? null),
      baseboardPreference: normalizeText(payload.baseboardPreference ?? null),
      preferredPanelProductId: payload.preferredPanelProductId ?? null,
      preferredBaseboardProductId: payload.preferredBaseboardProductId ?? null,
      requiresAdminAttention: payload.requiresAdminAttention,
      quoteSent: payload.quoteSent,
      depositInvoiceIssued: payload.depositInvoiceIssued,
      finalInvoiceIssued: payload.finalInvoiceIssued,
      stageChangedAt: stageChanged ? now : existing.stageChangedAt,
      updatedAt: now,
    };

    const updated = tx
      .update(orders)
      .set(record)
      .where(eq(orders.id, orderId))
      .returning()
      .get();

    if (!updated) {
      throw new Error("Nie udało się zaktualizować zlecenia.");
    }

    if (stageChanged) {
      tx
        .insert(orderStatusHistory)
        .values({
          orderId: updated.id,
          changedById: updatedById,
          fromStage: existing.stage,
          toStage: updated.stage,
          note: updated.stageNotes,
          createdAt: now,
        })
        .run();
    }

    // Synchronizuj montera do wszystkich montaży i pomiarów w tym zleceniu
    if (record.assignedInstallerId !== undefined) {
      tx
        .update(installations)
        .set({ 
          assignedInstallerId: record.assignedInstallerId,
          updatedAt: now
        })
        .where(eq(installations.orderId, updated.id))
        .run();

      tx
        .update(measurements)
        .set({ 
          assignedMeasurerId: record.assignedInstallerId,
          updatedAt: now
        })
        .where(eq(measurements.orderId, updated.id))
        .run();
    }

    return updated;
  });
}

export async function ensureOrderForClient(options: {
  clientId: string;
  createdById: string | null;
  title?: string | null;
}) {
  const { clientId, createdById, title } = options;

  const existingOrder = await db.query.orders.findFirst({
    where: (table, { eq }) => and(eq(table.clientId, clientId), ne(table.stage, "COMPLETED" as OrderStage)),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  if (existingOrder) {
    return existingOrder;
  }

  return createOrder(
    {
      clientId,
      partnerId: null,
      ownerId: null,
      assignedInstallerId: null,
      orderNumber: null,
      title: title ?? null,
      executionMode: "INSTALLATION_ONLY",
      stage: "RECEIVED",
      stageNotes: null,
      declaredFloorArea: null,
      declaredBaseboardLength: null,
      buildingType: null,
      panelPreference: null,
      baseboardPreference: null,
      preferredPanelProductId: null,
      preferredBaseboardProductId: null,
      requiresAdminAttention: false,
      quoteSent: false,
      depositInvoiceIssued: false,
      finalInvoiceIssued: false,
    },
    createdById,
  );
}

export type OrderSelectItem = {
  id: string;
  label: string;
  stage: OrderStage;
  assignedInstallerId: string | null;
};

export async function listOrdersForSelect(options?: {
  clientId?: string;
  stages?: OrderStage[];
}): Promise<OrderSelectItem[]> {
  const query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      title: orders.title,
      stage: orders.stage,
      clientName: clients.fullName,
      assignedInstallerId: orders.assignedInstallerId,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .orderBy(desc(orders.createdAt));

  const rows = options?.clientId
    ? options?.stages?.length
      ? await query
          .where(and(eq(orders.clientId, options.clientId), inArray(orders.stage, options.stages)))
      : await query.where(eq(orders.clientId, options.clientId))
    : options?.stages?.length
      ? await query.where(inArray(orders.stage, options.stages))
      : await query;

  return rows.map((row) => {
    const reference = row.orderNumber?.trim().length ? row.orderNumber : row.id.slice(0, 6).toUpperCase();
    const title = row.title?.trim().length ? row.title : "Zlecenie";
    const clientLabel = row.clientName ? ` · ${row.clientName}` : "";
    return {
      id: row.id,
      label: `${reference} – ${title}${clientLabel}`,
      stage: row.stage,
      assignedInstallerId: row.assignedInstallerId ?? null,
    };
  });
}

/**
 * Synchronizuje przypisanego montera ze zlecenia do wszystkich jego montaży.
 * Używane gdy admin zmienia montera na poziomie zlecenia.
 * 
 * @param orderId - ID zlecenia
 * @param installerId - ID montera do przypisania (lub null aby usunąć)
 */
export async function syncOrderInstallerToInstallations(
  orderId: string, 
  installerId: string | null
): Promise<void> {
  await db
    .update(installations)
    .set({ 
      assignedInstallerId: installerId,
      updatedAt: new Date()
    })
    .where(eq(installations.orderId, orderId))
    .run();
}
