import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OrderDetailsClient } from './_components/OrderDetailsClient';

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const orderId = params.id;

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            items: true,
            customer: true
        }
    });

    if (!order) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <OrderDetailsClient order={order} items={order.items} />
        </div>
    );
}
