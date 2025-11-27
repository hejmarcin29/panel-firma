'use server';

import { db } from '@/lib/db';
import { orders, montages, customers } from '@/lib/db/schema';
import { eq, isNotNull, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type CalendarEventType = 'order' | 'montage';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: Date | null;
  endDate?: Date | null;
  status: string;
  description?: string;
  amount?: string;
  address?: string;
}

export async function getCalendarEvents(): Promise<{ scheduled: CalendarEvent[]; unscheduled: CalendarEvent[] }> {
  const [ordersData, montagesData] = await Promise.all([
    db
      .select({
        id: orders.id,
        expectedShipDate: orders.expectedShipDate,
        status: orders.status,
        totalGross: orders.totalGross,
        currency: orders.currency,
        customerName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id)),
    db
      .select({
        id: montages.id,
        scheduledInstallationAt: montages.scheduledInstallationAt,
        scheduledInstallationEndAt: montages.scheduledInstallationEndAt,
        clientName: montages.clientName,
        address: montages.address,
        status: montages.status,
      })
      .from(montages),
  ]);

  const allOrders: CalendarEvent[] = ordersData.map((order) => ({
    id: order.id,
    type: 'order',
    title: order.customerName || 'Zamówienie',
    date: order.expectedShipDate,
    endDate: null,
    status: order.status,
    amount: new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: order.currency,
    }).format(order.totalGross / 100),
  }));

  const allMontages: CalendarEvent[] = montagesData.map((montage) => ({
    id: montage.id,
    type: 'montage',
    title: montage.clientName,
    date: montage.scheduledInstallationAt,
    endDate: montage.scheduledInstallationEndAt,
    status: montage.status,
    address: montage.address || '',
  }));

  const allEvents = [...allOrders, ...allMontages];

  return {
    scheduled: allEvents.filter((e) => e.date !== null),
    unscheduled: allEvents.filter((e) => e.date === null),
  };
}

export async function updateEventDate(
  id: string,
  type: CalendarEventType,
  date: Date | null
) {
  if (type === 'order') {
    await db
      .update(orders)
      .set({ expectedShipDate: date })
      .where(eq(orders.id, id));
  } else {
    await db
      .update(montages)
      .set({ scheduledInstallationAt: date })
      .where(eq(montages.id, id));
  }
  revalidatePath('/dashboard/calendar');
}

