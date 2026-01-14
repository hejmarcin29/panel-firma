import { db } from '@/lib/db';
import { orders, erpOrderTimeline } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OrderDetailsClient } from './_components/OrderDetailsClient';

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const orderId = params.id;

    const [order, timelineEvents] = await Promise.all([
        db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                items: true,
                customer: true
            }
        }),
        db.select()
          .from(erpOrderTimeline)
          .where(eq(erpOrderTimeline.orderId, orderId))
          .orderBy(asc(erpOrderTimeline.createdAt))
          // Safe catch in case table doesn't exist yet (though it should)
          .catch(() => [])
    ]);

    if (!order) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <OrderDetailsClient 
                order={order} 
                items={order.items} 
                timelineEvents={timelineEvents}
            />
        </div>
    );
}
