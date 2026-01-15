import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ShopOrdersList } from './_components/ShopOrdersList';

export default async function ShopOrdersPage() {
    const shopOrders = await db.query.orders.findMany({
        where: eq(orders.source, 'shop'),
        orderBy: [desc(orders.createdAt)],
        with: {
            customer: true,
        },
        // Limit for performance if needed, but for "Top " UX infinite scroll is better.
        // For now, let's fetch last 100.
        limit: 100,
    });

    return (
        <div className="space-y-6">
             <div>
                <h3 className="text-lg font-medium">Centrum Zamówień Sklepowych</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzanie zamówieniami z oddzielnymi procesami dla Próbek (Automatyzacja) i Podłóg (Wycena).
                </p>
            </div>

            <ShopOrdersList orders={shopOrders} />
        </div>
    );
}
