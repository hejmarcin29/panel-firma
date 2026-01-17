// src/lib/shop/order-service.ts
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';

export async function generateNextOrderDisplayNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `ZM/${year}/`;

    // Znajdź ostatnie zamówienie z tego roku
    const lastOrder = await db.query.orders.findFirst({
        where: (table, { like }) => like(table.displayNumber, `${prefix}%`),
        orderBy: (table, { desc }) => [desc(table.displayNumber)],
        columns: { displayNumber: true }
    });

    let nextNumber = 1;

    if (lastOrder && lastOrder.displayNumber) {
        // Format: ZM/2026/001
        const parts = lastOrder.displayNumber.split('/');
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2], 10);
            if (!isNaN(lastSeq)) {
                nextNumber = lastSeq + 1;
            }
        }
    }

    // Formatowanie do 3 cyfr (np. 015)
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}
