import { NextRequest, NextResponse } from 'next/server';
import { getTransactionDetails } from '@/lib/tpay';
import { db } from '@/lib/db';
import { montagePayments, orders, systemLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        // Tpay usually sends application/x-www-form-urlencoded
        const formData = await req.formData();
        
        // Extract basic fields
        const tr_id = formData.get('tr_id') as string;
        const tr_crc = formData.get('tr_crc') as string;
        const tr_paid = formData.get('tr_paid') as string;
        const tr_status = formData.get('tr_status') as string;
        
        // Log the incoming hit
          await db.insert(systemLogs).values({
            id: crypto.randomUUID(),
            action: 'tpay_notification_received',
            details: JSON.stringify({ tr_id, tr_crc, tr_status, tr_paid }),
        });

        if (tr_status === 'TRUE') {
            // "Double Verification": Call Tpay API to confirm the status is definitely 'correct'
            // This prevents spoofing via falsified POST requests
            const details = await getTransactionDetails(tr_id);
            
            // Allow 'correct' or 'paid' status depending on API version
            if (details.status === 'correct' || details.status === 'paid') {
                await handlePaymentSuccess(tr_id, tr_crc);
                return new NextResponse('TRUE', { status: 200 });
            } else {
                console.error(`Tpay verification check failed. API Status: ${details.status}`);
            }
        }

        return new NextResponse('TRUE', { status: 200 }); // Always acknowledge to stop retries if it's not a critical failure
    } catch (error) {
        console.error('Tpay Notification Error:', error);
        return new NextResponse('FALSE', { status: 500 });
    }
}

async function handlePaymentSuccess(transactionId: string, crc: string) {
    // 1. MONTAGE PAYMENT
    if (crc.startsWith('MONTAGE_')) {
        // Format: MONTAGE_{PaymentID} or MONTAGE_{MontageID}_{Timestamp}
        // Ideally we stored the PaymentID in the CRC when creating the payment.
        // Let's assume CRC = PaymentID for simplicity, or we parse it.
        // If we used the Payment ROW ID as CRC, direct lookup is easy.
        
        const paymentId = crc.replace('MONTAGE_', '');
        
        await db.update(montagePayments)
            .set({ 
                status: 'paid', 
                paidAt: new Date(), 
                transactionId: transactionId 
            })
            .where(eq(montagePayments.id, paymentId));

        // OPTIONAL: Auto-change montage status?
        // We could look up the montageId and update montage status, but sticking to the plan:
        // just mark the payment row as paid. The UI will show green.
    }
    
    // 2. SHOP ORDER
    else if (crc.startsWith('ORDER_')) {
        const orderId = crc.replace('ORDER_', '');
        
        await db.update(orders)
            .set({ 
                status: 'order.paid', 
                // We might want to store transactionId in orders table too, but for now we update status
            })
            .where(eq(orders.id, orderId));
    }
}
