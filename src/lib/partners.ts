import { asc, desc, eq } from "drizzle-orm";

import { db } from "@db/index";
import {
  partnerStatusHistory,
  partners,
  type PartnerStatus,
} from "@db/schema";

import { archivePartnerSchema, changePartnerStatusSchema, createPartnerSchema, updatePartnerSchema } from "./partners/schemas";
import type {
  ArchivePartnerInput,
  ChangePartnerStatusInput,
  CreatePartnerInput,
  UpdatePartnerInput,
} from "./partners/schemas";
type PartnerInsertInput = CreatePartnerInput;
type PartnerUpdateInput = UpdatePartnerInput;
type ChangeStatusInput = ChangePartnerStatusInput;
type ArchiveInput = ArchivePartnerInput;

type PartnerRecord = typeof partners.$inferSelect;

type StatusHistoryRecord = typeof partnerStatusHistory.$inferSelect;

const now = () => new Date();

const cleanUndefined = <T extends Record<string, unknown>>(input: T) => {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
};

export async function createPartner(
  payload: PartnerInsertInput,
  userId: string
): Promise<PartnerRecord> {
  const data = createPartnerSchema.parse(payload);
  const insertPayload: typeof partners.$inferInsert = {
    companyName: data.companyName,
    segment: data.segment ?? null,
    region: data.region ?? null,
    status: data.status ?? "ROZWOJOWY",
    contactName: data.contactName ?? null,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    taxId: data.taxId ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    notes: data.notes ?? null,
    archivedAt: null,
    archivedReason: null,
    createdAt: now(),
    updatedAt: now(),
  };

  const [created] = await db.insert(partners).values(insertPayload).returning();

  if (!created) {
    throw new Error("Nie udało się utworzyć partnera.");
  }

  await recordPartnerStatusChange({
    partnerId: created.id,
    changedById: userId,
    fromStatus: null,
    toStatus: created.status,
    comment: "Utworzono partnera",
  });

  return created;
}

export async function updatePartner(
  partnerId: string,
  payload: PartnerUpdateInput,
  changedById: string | null
): Promise<PartnerRecord> {
  const data = updatePartnerSchema.parse(payload);
  const existing = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!existing) {
    throw new Error("Partner nie istnieje.");
  }

  const updatePayload = cleanUndefined({
    companyName: data.companyName,
    segment: data.segment,
    region: data.region,
    status: data.status,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    taxId: data.taxId,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    updatedAt: now(),
  }) as Partial<typeof partners.$inferInsert>;

  if (Object.keys(updatePayload).length === 1 && "updatedAt" in updatePayload) {
    return existing;
  }

  const [updated] = await db
    .update(partners)
    .set(updatePayload)
    .where(eq(partners.id, partnerId))
    .returning();

  if (!updated) {
    throw new Error("Partner nie istnieje.");
  }

  if (data.status !== undefined && data.status !== existing.status) {
    await recordPartnerStatusChange({
      partnerId: partnerId,
      changedById,
      fromStatus: existing.status,
      toStatus: data.status,
    });
  }

  return updated;
}

export async function changePartnerStatus(
  partnerId: string,
  payload: ChangeStatusInput,
  changedById: string | null
): Promise<PartnerRecord> {
  const data = changePartnerStatusSchema.parse(payload);
  const existing = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!existing) {
    throw new Error("Partner nie istnieje.");
  }

  if (existing.status === data.status && !data.comment) {
    return existing;
  }

  const [updated] = await db
    .update(partners)
    .set({ status: data.status, updatedAt: now() })
    .where(eq(partners.id, partnerId))
    .returning();

  if (!updated) {
    throw new Error("Nie udało się zaktualizować statusu partnera.");
  }

  await recordPartnerStatusChange({
    partnerId,
    changedById,
    fromStatus: existing.status,
    toStatus: data.status,
    comment: data.comment,
  });

  return updated;
}

export async function archivePartner(
  partnerId: string,
  payload: ArchiveInput,
  changedById: string | null
): Promise<PartnerRecord> {
  const data = archivePartnerSchema.parse(payload);
  const existing = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!existing) {
    throw new Error("Partner nie istnieje.");
  }

  if (data.archived) {
    const [updated] = await db
      .update(partners)
      .set({
        archivedAt: now(),
        archivedReason: data.reason ?? existing.archivedReason,
        status: "WSTRZYMANY",
        updatedAt: now(),
      })
      .where(eq(partners.id, partnerId))
      .returning();

    if (!updated) {
      throw new Error("Nie udało się zarchiwizować partnera.");
    }

    if (existing.status !== "WSTRZYMANY") {
      await recordPartnerStatusChange({
        partnerId,
        changedById,
        fromStatus: existing.status,
        toStatus: "WSTRZYMANY",
        comment: data.reason,
      });
    }

    return updated;
  }

  const [updated] = await db
    .update(partners)
    .set({ archivedAt: null, archivedReason: null, updatedAt: now() })
    .where(eq(partners.id, partnerId))
    .returning();

  if (!updated) {
    throw new Error("Nie udało się przywrócić partnera.");
  }

  return updated;
}

async function recordPartnerStatusChange({
  partnerId,
  changedById,
  fromStatus,
  toStatus,
  comment,
}: {
  partnerId: string;
  changedById: string | null;
  fromStatus: PartnerStatus | null;
  toStatus: PartnerStatus;
  comment?: string | null;
}): Promise<StatusHistoryRecord> {
  const [record] = await db
    .insert(partnerStatusHistory)
    .values({
      partnerId,
      changedById,
      fromStatus: fromStatus ?? null,
      toStatus,
      comment: comment ?? null,
      createdAt: now(),
    })
    .returning();

  if (!record) {
    throw new Error("Nie udało się zapisać historii statusu partnera.");
  }

  return record;
}

export function serializePartner(partner: PartnerRecord) {
  return {
    ...partner,
    archivedAt: partner.archivedAt ? new Date(partner.archivedAt) : null,
    createdAt: new Date(partner.createdAt),
    updatedAt: new Date(partner.updatedAt),
  };
}

export function serializePartnerStatusChange(record: StatusHistoryRecord) {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
  };
}

export type PartnerEntity = ReturnType<typeof serializePartner>;
export type PartnerStatusChange = ReturnType<typeof serializePartnerStatusChange>;

export async function listPartners(): Promise<PartnerEntity[]> {
  const rows = await db.query.partners.findMany({
    orderBy: asc(partners.companyName),
  });
  return rows.map(serializePartner);
}

export async function listPartnersForSelect(): Promise<Array<{ id: string; label: string }>> {
  const rows = await db
    .select({
      id: partners.id,
      companyName: partners.companyName,
      region: partners.region,
    })
    .from(partners)
    .orderBy(asc(partners.companyName));

  return rows.map((row) => ({
    id: row.id,
    label: row.region ? `${row.companyName} · ${row.region}` : row.companyName,
  }));
}

export async function getPartnerById(partnerId: string): Promise<PartnerEntity | null> {
  const record = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  return record ? serializePartner(record) : null;
}

export async function getPartnerStatusHistory(
  partnerId: string,
  limit = 10
): Promise<PartnerStatusChange[]> {
  const history = await db.query.partnerStatusHistory.findMany({
    where: eq(partnerStatusHistory.partnerId, partnerId),
    orderBy: desc(partnerStatusHistory.createdAt),
    limit,
  });

  return history.map(serializePartnerStatusChange);
}

export type RecentPartnerStatusChange = {
  id: string;
  partnerId: string;
  partnerName: string;
  fromStatus: PartnerStatus | null;
  toStatus: PartnerStatus;
  comment: string | null;
  createdAt: Date;
};

export async function getRecentPartnerStatusChanges(limit = 6): Promise<RecentPartnerStatusChange[]> {
  const rows = await db
    .select({
      id: partnerStatusHistory.id,
      partnerId: partnerStatusHistory.partnerId,
      partnerName: partners.companyName,
      fromStatus: partnerStatusHistory.fromStatus,
      toStatus: partnerStatusHistory.toStatus,
      comment: partnerStatusHistory.comment,
      createdAt: partnerStatusHistory.createdAt,
    })
    .from(partnerStatusHistory)
    .leftJoin(partners, eq(partners.id, partnerStatusHistory.partnerId))
    .orderBy(desc(partnerStatusHistory.createdAt))
    .limit(limit);

  return rows
    .filter((row) => !!row.partnerId && !!row.partnerName)
    .map((row) => ({
      id: row.id,
      partnerId: row.partnerId,
      partnerName: row.partnerName ?? "Partner",
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      comment: row.comment ?? null,
      createdAt: new Date(row.createdAt),
    }));
}

export type PartnerMetrics = {
  total: number;
  active: number;
  strategic: number;
  development: number;
  suspended: number;
  archived: number;
};

export function computePartnerMetrics(partnersList: PartnerEntity[]): PartnerMetrics {
  return partnersList.reduce<PartnerMetrics>(
    (acc, partner) => {
      acc.total += 1;
      if (partner.archivedAt) {
        acc.archived += 1;
      }

      switch (partner.status) {
        case "STRATEGICZNY":
          acc.strategic += 1;
          acc.active += 1;
          break;
        case "AKTYWNY":
          acc.active += 1;
          break;
        case "ROZWOJOWY":
          acc.development += 1;
          break;
        case "WSTRZYMANY":
          acc.suspended += 1;
          break;
        default:
          break;
      }

      return acc;
    },
    {
      total: 0,
      active: 0,
      strategic: 0,
      development: 0,
      suspended: 0,
      archived: 0,
    }
  );
}

export {
  archivePartnerSchema,
  changePartnerStatusSchema,
  createPartnerSchema,
  updatePartnerSchema,
  partnerStatuses,
} from "./partners/schemas";
export type {
  ArchivePartnerInput,
  ChangePartnerStatusInput,
  CreatePartnerInput,
  PartnerStatusOption,
  UpdatePartnerInput,
} from "./partners/schemas";
