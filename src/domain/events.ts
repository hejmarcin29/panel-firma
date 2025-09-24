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
} as const;

export type DomainEventType = typeof DomainEventTypes[keyof typeof DomainEventTypes];

// Payload schemas
export const clientCreatedPayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const clientUpdatedPayloadSchema = z.object({
  id: z.string().uuid(),
  changedFields: z.array(z.string()).min(1),
});

export const clientDeletedPayloadSchema = z.object({
  id: z.string().uuid(),
});

export const clientNoteAddedPayloadSchema = z.object({
  id: z.string().uuid(), // note id
  clientId: z.string().uuid(),
});

export type ClientCreatedPayload = z.infer<typeof clientCreatedPayloadSchema>;
export type ClientUpdatedPayload = z.infer<typeof clientUpdatedPayloadSchema>;
export type ClientDeletedPayload = z.infer<typeof clientDeletedPayloadSchema>;
export type ClientNoteAddedPayload = z.infer<typeof clientNoteAddedPayloadSchema>;

const payloadSchemaByType: Record<DomainEventType, z.ZodTypeAny> = {
  [DomainEventTypes.clientCreated]: clientCreatedPayloadSchema,
  [DomainEventTypes.clientUpdated]: clientUpdatedPayloadSchema,
  [DomainEventTypes.clientDeleted]: clientDeletedPayloadSchema,
  [DomainEventTypes.clientNoteAdded]: clientNoteAddedPayloadSchema,
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
