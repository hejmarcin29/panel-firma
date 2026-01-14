'use server';

import { db } from '@/lib/db';
import { orders, type OrderStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateMagicLinkToken } from '@/lib/auth/magic-link';

export async function generateOrderMagicLink(orderId: string) {
    const token = generateMagicLinkToken(orderId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl'; 
    return `${baseUrl}/order/status?token=${token}`;
}

export async function updateShopOrderStatus(orderId: string, newStatus: string) {
    await db.update(orders)
        .set({ status: newStatus as OrderStatus })
        .where(eq(orders.id, orderId));
    
    revalidatePath(`/dashboard/shop/orders/${orderId}`);
    revalidatePath('/dashboard/shop/orders');
    return { success: true };
}

export async function generateShippingLabel(orderId: string) {
    // In a real app, this would call InPost API
    // For now, we simulate a delay and return success
    
    // Check if integration exists/configured...
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    // Auto-update status to fulfillment_confirmed for samples
    await updateShopOrderStatus(orderId, 'order.fulfillment_confirmed');

    return { 
        success: true, 
        trackingNumber: '6482910392134',
        labelUrl: '#' // In real world: PDF URL
    };
}

export async function markAsForwardedToSupplier(orderId: string) {
    await updateShopOrderStatus(orderId, 'order.forwarded_to_supplier');
    return { success: true };
}

export async function markAsShippedBySupplier(orderId: string) {
    await updateShopOrderStatus(orderId, 'order.fulfillment_confirmed');
    return { success: true };
}

export async function issueFinalInvoice(orderId: string) {
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real app: generate PDF, save to documents table
    await updateShopOrderStatus(orderId, 'order.closed');
    return { success: true };
}
