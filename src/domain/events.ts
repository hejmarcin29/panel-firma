import { z } from 'zod';
import { db } from '@/db';
import { domainEvents } from '@/db/schema';
import { randomUUID } from 'crypto';

// Event type constants
export const DomainEventTypes = {
  clientCreated: 'client.created',
  clientUpdated: 'client.updated',
  clientDeleted: 'client.deleted',
  clientNoteAdded: 'client.note.added',
  clientServiceTypeChanged: 'client.serviceType.changed',
  orderCreated: 'order.created',
  orderStatusChanged: 'order.status.changed',
  userRoleChanged: 'user.role.changed',
  userPasswordChanged: 'user.password.changed',
} as const;

export type DomainEventType = typeof DomainEventTypes[keyof typeof DomainEventTypes];

// Payload schemas
export const clientCreatedPayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  serviceType: z.string().optional(),
});

// For client.updated we allow an optional detailed changes array for richer diff visualization.
// Each change: { field, before, after }
export const clientUpdatedPayloadSchema = z.object({
  id: z.string().uuid(),
  changedFields: z.array(z.string()).min(1),
  changes: z
    .array(
      z.object({
        field: z.string(),
        before: z.any().optional(),
        after: z.any().optional(),
      })
    )
    .optional(),
});

export const clientDeletedPayloadSchema = z.object({
  id: z.string().uuid(),
});

export const clientNoteAddedPayloadSchema = z.object({
  id: z.string().uuid(), // note id
  clientId: z.string().uuid(),
});

export const clientServiceTypeChangedPayloadSchema = z.object({
  id: z.string().uuid(), // client id
  before: z.string(),
  after: z.string(),
});

// Orders
export const orderCreatedPayloadSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  type: z.enum(['delivery','installation']),
  status: z.string(),
  // human-friendly numbers (optional when not yet assigned)
  clientNo: z.number().int().positive().optional().nullable(),
  orderNo: z.string().optional().nullable(),
});

export const orderStatusChangedPayloadSchema = z.object({
  id: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  clientNo: z.number().int().positive().optional().nullable(),
  orderNo: z.string().optional().nullable(),
});

// Users
export const userRoleChangedPayloadSchema = z.object({
  id: z.string().uuid(),
  before: z.string(),
  after: z.string(),
});

export const userPasswordChangedPayloadSchema = z.object({
  id: z.string().uuid(),
});

export type ClientCreatedPayload = z.infer<typeof clientCreatedPayloadSchema>;
export type ClientUpdatedPayload = z.infer<typeof clientUpdatedPayloadSchema>;
export type ClientDeletedPayload = z.infer<typeof clientDeletedPayloadSchema>;
export type ClientNoteAddedPayload = z.infer<typeof clientNoteAddedPayloadSchema>;
export type ClientServiceTypeChangedPayload = z.infer<typeof clientServiceTypeChangedPayloadSchema>;
export type OrderCreatedPayload = z.infer<typeof orderCreatedPayloadSchema>;
export type OrderStatusChangedPayload = z.infer<typeof orderStatusChangedPayloadSchema>;
export type UserRoleChangedPayload = z.infer<typeof userRoleChangedPayloadSchema>;
export type UserPasswordChangedPayload = z.infer<typeof userPasswordChangedPayloadSchema>;

const payloadSchemaByType: Record<DomainEventType, z.ZodTypeAny> = {
  [DomainEventTypes.clientCreated]: clientCreatedPayloadSchema,
  [DomainEventTypes.clientUpdated]: clientUpdatedPayloadSchema,
  [DomainEventTypes.clientDeleted]: clientDeletedPayloadSchema,
  [DomainEventTypes.clientNoteAdded]: clientNoteAddedPayloadSchema,
  [DomainEventTypes.clientServiceTypeChanged]: clientServiceTypeChangedPayloadSchema,
  [DomainEventTypes.orderCreated]: orderCreatedPayloadSchema,
  [DomainEventTypes.orderStatusChanged]: orderStatusChangedPayloadSchema,
  [DomainEventTypes.userRoleChanged]: userRoleChangedPayloadSchema,
  [DomainEventTypes.userPasswordChanged]: userPasswordChangedPayloadSchema,
};

interface EmitBase<T extends DomainEventType> {
  type: T;
  actor?: string | null; // email / system
  entity?: { type: string; id: string } | null;
  payload: z.infer<(typeof payloadSchemaByType)[T]>;
  occurredAt?: number; // epoch ms override
  schemaVersion?: number;
}

export async function emitDomainEvent<T extends DomainEventType>(params: EmitBase<T>) {
  const schema = payloadSchemaByType[params.type];
  const parsed = schema.parse(params.payload);
  const id = randomUUID();
  const occurredAtMs = params.occurredAt ?? Date.now();
  await db.insert(domainEvents).values({
    id,
    type: params.type,
    occurredAt: new Date(occurredAtMs),
    actor: params.actor ?? null,
    entityType: params.entity?.type ?? null,
    entityId: params.entity?.id ?? null,
    payload: JSON.stringify(parsed),
    schemaVersion: params.schemaVersion ?? 1,
  });
  return id;
}
