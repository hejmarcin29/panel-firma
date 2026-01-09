'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { manualOrders, orderAttachments } from '@/lib/db/schema';
import { uploadOrderDocumentObject } from '@/lib/r2/storage';
import { logSystemEvent } from '@/lib/logging';

import type {
ManualOrderPayload,
Order,
OrderDocument,
} from './data';
import { normalizeStatus, parseTaskOverrides } from './utils';
import { 
    getFilteredOrders, 
    getManualOrderById as getOrderByIdService, 
    createOrder as createOrderService,
    getDocumentsForOrder
} from '@/lib/services/orders-service';

const MAX_ORDER_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

type OrderAttachmentInsert = typeof orderAttachments.$inferInsert;

function ensureValidOrderAttachmentFile(file: File) {
if (!(file instanceof File)) {
throw new Error('Wybierz plik do przesłania.');
}

if (file.size === 0) {
throw new Error('Plik jest pusty.');
}

if (file.size > MAX_ORDER_ATTACHMENT_SIZE_BYTES) {
throw new Error('Plik jest zbyt duży. Maksymalny rozmiar to 25 MB.');
}
}

export async function getManualOrderById(id: string): Promise<Order | null> {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        return null;
    }
    const order = await getOrderByIdService(id);
    if (order) {
        order.status = normalizeStatus(order.status);
    }
    return order;
}

export async function getManualOrders(filter?: string): Promise<Order[]> {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        return [];
    }
    const orders = await getFilteredOrders(filter);
    return orders.map(o => ({
        ...o,
        status: normalizeStatus(o.status)
    }));
}

export async function createOrder(payload: ManualOrderPayload, userId?: string | null): Promise<Order> {
    const created = await createOrderService(payload);

await logSystemEvent('create_order', `Utworzono zamówienie ${payload.reference}`, userId);

revalidatePath('/dashboard/orders');

return created;
}

export async function createManualOrder(payload: ManualOrderPayload): Promise<Order> {
const user = await requireUser();
if (user.roles.includes('installer') && !user.roles.includes('admin')) {
    throw new Error('Unauthorized');
}
return createOrder(payload, user.id);
}

export async function confirmManualOrder(orderId: string, type: 'production' | 'sample' = 'production'): Promise<Order> {
const user = await requireUser();
if (user.roles.includes('installer') && !user.roles.includes('admin')) {
    throw new Error('Unauthorized');
}
const orderRow = await db.query.manualOrders.findFirst({
where: eq(manualOrders.id, orderId),
});

if (!orderRow) {
throw new Error('Nie znaleziono zamówienia do potwierdzenia.');
}

const updatedRow = await db
.update(manualOrders)
.set({
requiresReview: false,
type,
status: 'Weryfikacja i płatność',
updatedAt: new Date(),
})
.where(eq(manualOrders.id, orderId))
.returning({ id: manualOrders.id });

if (!updatedRow) {
throw new Error('Nie znaleziono zamówienia do potwierdzenia.');
}

const updated = await getOrderByIdService(orderId);

if (!updated) {
throw new Error('Nie udało się odczytać zatwierdzonego zamówienia.');
}

await logSystemEvent('confirm_order', `Zatwierdzono zamówienie ${orderId}`, user.id);

revalidatePath('/dashboard/orders');
revalidatePath(`/dashboard/orders/${orderId}`);

return updated;
}

export async function getOrderDocuments(orderId: string): Promise<OrderDocument[]> {
    return getDocumentsForOrder(orderId);
}

export async function addOrderAttachment(formData: FormData): Promise<void> {
const user = await requireUser();

const orderIdRaw = formData.get('orderId');
const titleRaw = formData.get('title');
const fileField = formData.get('file');

const orderId = typeof orderIdRaw === 'string' ? orderIdRaw.trim() : '';
const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';

if (!orderId) {
throw new Error('Brakuje identyfikatora zamówienia.');
}

if (!(fileField instanceof File)) {
throw new Error('Wybierz plik do przesłania.');
}

ensureValidOrderAttachmentFile(fileField);

const orderRecord = await db.query.manualOrders.findFirst({
columns: {
id: true,
billingName: true,
},
where: eq(manualOrders.id, orderId),
});

if (!orderRecord) {
throw new Error('Nie znaleziono zamówienia.');
}

const uploaded = await uploadOrderDocumentObject({
customerName: orderRecord.billingName,
file: fileField,
});

const now = new Date();
const attachmentRecord: OrderAttachmentInsert = {
id: crypto.randomUUID(),
orderId: orderRecord.id,
title: title ? title : null,
url: uploaded.url,
uploadedBy: user.id,
createdAt: now,
};

await db.insert(orderAttachments).values(attachmentRecord);

await db
.update(manualOrders)
.set({ updatedAt: now })
.where(eq(manualOrders.id, orderRecord.id));

revalidatePath(`/dashboard/orders/${orderRecord.id}`);
revalidatePath('/dashboard/orders');
}

export async function updateManualOrderTaskOverride(
orderId: string,
taskId: string,
completed: boolean | null,
): Promise<void> {
await requireUser();

if (!taskId) {
throw new Error('Niepoprawny identyfikator zadania.');
}

const row = await db.query.manualOrders.findFirst({
columns: {
timelineTaskOverrides: true,
},
where: eq(manualOrders.id, orderId),
});

if (!row) {
throw new Error('Nie znaleziono zamówienia do aktualizacji zadań.');
}

const overrides = parseTaskOverrides(row.timelineTaskOverrides);

if (completed === null) {
delete overrides[taskId];
} else {
overrides[taskId] = completed;
}

const serialized = Object.keys(overrides).length === 0 ? null : JSON.stringify(overrides);

await db
.update(manualOrders)
.set({
timelineTaskOverrides: serialized,
updatedAt: new Date(),
})
.where(eq(manualOrders.id, orderId));

revalidatePath(`/dashboard/orders/${orderId}`);
}

export async function updateManualOrderStatus(orderId: string, nextStatus: string, note?: string): Promise<Order> {
const user = await requireUser();
const typedStatus = normalizeStatus(nextStatus);

const orderRow = await db.query.manualOrders.findFirst({
where: eq(manualOrders.id, orderId),
});

if (!orderRow) {
throw new Error('Nie znaleziono zamówienia do aktualizacji.');
}

const trimmedNote = note?.trim() ?? '';
const currentStatus = normalizeStatus(orderRow.status);
const shouldUnsetReview = Boolean(orderRow.requiresReview) && typedStatus !== 'order.received';
let combinedNotes = orderRow.notes ?? '';

if (trimmedNote) {
const actor = user.name?.trim() ? user.name : user.email;
const timestamp = new Intl.DateTimeFormat('pl-PL', {
dateStyle: 'short',
timeStyle: 'short',
}).format(new Date());
const noteLine = `Status: ${typedStatus} (${timestamp})|${trimmedNote} — ${actor}`;
combinedNotes = combinedNotes ? `${combinedNotes}\n${noteLine}` : noteLine;
}

const noChange =
currentStatus === typedStatus &&
!trimmedNote &&
!shouldUnsetReview;

if (noChange) {
const existing = await getOrderByIdService(orderId);
if (!existing) {
throw new Error('Nie udało się odczytać zamówienia po próbie aktualizacji.');
}
return existing;
}

const updateData: Partial<typeof manualOrders.$inferInsert> = {
status: typedStatus,
updatedAt: new Date(),
};

if (trimmedNote) {
updateData.notes = combinedNotes;
}

if (shouldUnsetReview) {
updateData.requiresReview = false;
}

await db
.update(manualOrders)
.set(updateData)
.where(eq(manualOrders.id, orderId));

await logSystemEvent('update_order_status', `Zmiana statusu zamówienia ${orderId} na ${typedStatus}`, user.id);

const updated = await getOrderByIdService(orderId);

if (!updated) {
throw new Error('Nie udało się odczytać zaktualizowanego zamówienia.');
}

revalidatePath('/dashboard/orders');
revalidatePath(`/dashboard/orders/${orderId}`);

return updated;
}

export async function updateOrderNote(orderId: string, note: string) {
	const user = await requireUser();

	await db
		.update(manualOrders)
		.set({
			notes: note,
			updatedAt: new Date(),
		})
		.where(eq(manualOrders.id, orderId));

	await logSystemEvent('update_order_note', `Zaktualizowano notatkę zamówienia ${orderId}`, user.id);

	revalidatePath('/dashboard/crm/orders');
	revalidatePath(`/dashboard/crm/orders/${orderId}`);
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
    const user = await requireUser();
    
    // Simple drag and drop update
    await db
        .update(manualOrders)
        .set({ 
            status: newStatus,
            updatedAt: new Date(),
        })
        .where(eq(manualOrders.id, orderId));
        
    await logSystemEvent('update_order_status', `Status changed to ${newStatus} (Drag & Drop)`, user.id);
    
    revalidatePath('/dashboard/crm/orders');
}
