import { z } from 'zod';
import { db } from '@/db';
import { domainEvents } from '@/db/schema';
import { randomUUID } from 'crypto';

// Event type constants
export const DomainEventTypes = {
  clientCreated: 'client.created',
  clientUpdated: 'client.updated',
  clientDeleted: 'client.deleted',
  clientArchived: 'client.archived',
  clientUnarchived: 'client.unarchived',
  clientNoteAdded: 'client.note.added',
  clientServiceTypeChanged: 'client.serviceType.changed',
  orderCreated: 'order.created',
  orderStatusChanged: 'order.status.changed',
  orderWon: 'order.won',
  orderLost: 'order.lost',
  orderOutcomeCleared: 'order.outcome.cleared',
  orderPipelineChanged: 'order.pipeline.changed',
  orderChecklistToggled: 'order.checklist.toggled',
  ordersArchivedForClient: 'order.archived.bulkForClient',
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

export const clientArchivedPayloadSchema = z.object({
  id: z.string().uuid(),
});

export const clientUnarchivedPayloadSchema = z.object({
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

export const orderOutcomePayloadSchema = z.object({
  id: z.string().uuid(),
  outcome: z.enum(['won','lost']),
  clientNo: z.number().int().positive().optional().nullable(),
  orderNo: z.string().optional().nullable(),
  reasonCode: z.string().optional().nullable(),
  reasonNote: z.string().optional().nullable(),
});

export const orderOutcomeClearedPayloadSchema = z.object({
  id: z.string().uuid(),
  clientNo: z.number().int().positive().optional().nullable(),
  orderNo: z.string().optional().nullable(),
});

export const orderPipelineChangedPayloadSchema = z.object({
  id: z.string().uuid(),
  from: z.string().nullable(),
  to: z.string(),
  type: z.enum(['delivery','installation']),
  clientNo: z.number().int().positive().optional().nullable(),
  orderNo: z.string().optional().nullable(),
});

export const orderChecklistToggledPayloadSchema = z.object({
  id: z.string().uuid(), // order id
  key: z.string(),
  done: z.boolean(),
  actorId: z.string().uuid().optional().nullable(),
});

export const ordersArchivedForClientPayloadSchema = z.object({
  clientId: z.string().uuid(),
  count: z.number().int().nonnegative(),
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
export type ClientArchivedPayload = z.infer<typeof clientArchivedPayloadSchema>;
export type ClientUnarchivedPayload = z.infer<typeof clientUnarchivedPayloadSchema>;
export type ClientNoteAddedPayload = z.infer<typeof clientNoteAddedPayloadSchema>;
export type ClientServiceTypeChangedPayload = z.infer<typeof clientServiceTypeChangedPayloadSchema>;
export type OrderCreatedPayload = z.infer<typeof orderCreatedPayloadSchema>;
export type OrderStatusChangedPayload = z.infer<typeof orderStatusChangedPayloadSchema>;
export type OrderOutcomePayload = z.infer<typeof orderOutcomePayloadSchema>;
export type OrderPipelineChangedPayload = z.infer<typeof orderPipelineChangedPayloadSchema>;
export type OrderChecklistToggledPayload = z.infer<typeof orderChecklistToggledPayloadSchema>;
export type OrdersArchivedForClientPayload = z.infer<typeof ordersArchivedForClientPayloadSchema>;
export type UserRoleChangedPayload = z.infer<typeof userRoleChangedPayloadSchema>;
export type UserPasswordChangedPayload = z.infer<typeof userPasswordChangedPayloadSchema>;

const payloadSchemaByType: Record<DomainEventType, z.ZodTypeAny> = {
  [DomainEventTypes.clientCreated]: clientCreatedPayloadSchema,
  [DomainEventTypes.clientUpdated]: clientUpdatedPayloadSchema,
  [DomainEventTypes.clientDeleted]: clientDeletedPayloadSchema,
  [DomainEventTypes.clientArchived]: clientArchivedPayloadSchema,
  [DomainEventTypes.clientUnarchived]: clientUnarchivedPayloadSchema,
  [DomainEventTypes.clientNoteAdded]: clientNoteAddedPayloadSchema,
  [DomainEventTypes.clientServiceTypeChanged]: clientServiceTypeChangedPayloadSchema,
  [DomainEventTypes.orderCreated]: orderCreatedPayloadSchema,
  [DomainEventTypes.orderStatusChanged]: orderStatusChangedPayloadSchema,
  [DomainEventTypes.orderWon]: orderOutcomePayloadSchema,
  [DomainEventTypes.orderLost]: orderOutcomePayloadSchema,
  [DomainEventTypes.orderPipelineChanged]: orderPipelineChangedPayloadSchema,
  [DomainEventTypes.orderChecklistToggled]: orderChecklistToggledPayloadSchema,
  [DomainEventTypes.ordersArchivedForClient]: ordersArchivedForClientPayloadSchema,
  [DomainEventTypes.orderOutcomeCleared]: orderOutcomeClearedPayloadSchema,
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
