import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, montages, userRoles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logSystemEvent } from '@/lib/logging';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');

    if (!orderId || !token) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Validate Order
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
    });

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Mock Payment Success
    await db.update(orders)
        .set({ 
            status: 'order.paid', 
            paymentMethod: 'tpay',
            updatedAt: new Date() 
        })
        .where(eq(orders.id, orderId));

    // 3. Update Montage Status (The "Gate" logic)
    // If order has sourceOrderId, updates that montage
    if (order.sourceOrderId) {
        await db.update(montages)
            .set({ 
                status: 'measurement_to_schedule', // Unlocks the process
                updatedAt: new Date() 
            })
            .where(eq(montages.id, order.sourceOrderId));
            
        // Trigger system log
        await logSystemEvent(
            'payment_received', 
            `Otrzymano płatność za zamówienie techniczne (ID: ${orderId}). Odblokowano montaż.`, 
            'system'
        );
    }

    // 4. Redirect back to portal
    return NextResponse.redirect(new URL(`/montaz/${token}`, request.url));
}
