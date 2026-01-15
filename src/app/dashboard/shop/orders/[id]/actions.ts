'use server';

import { db } from '@/lib/db';
import { orders, type OrderStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateMagicLinkToken } from '@/lib/auth/magic-link';
import { headers } from 'next/headers';

import { createShipment } from '@/lib/inpost/client';

export async function generateOrderMagicLink(orderId: string) {
    const token = generateMagicLinkToken(orderId);
    
    // Dynamicznie pobierz domenę z nagłówków żądania (działa na test, localhost i prod)
    const headersList = await headers();
    const host = headersList.get('host') || 'b2b.primepodloga.pl';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    return `${protocol}://${host}/order/status?token=${token}`;
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
    // 1. Fetch Order Data
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
    });

    if (!order || !order.shippingAddress) {
        throw new Error("Zamówienie lub adres dostawy nie istnieje.");
    }

    const address = order.shippingAddress as {
        name: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        phone: string;
        email: string;
    };

    // 2. Map to InPost Payload
    // Note: This defaults to Courier Standard as we don't have Locker selection yet
    try {
        const shipment = await createShipment({
            receiver: {
                first_name: address.name.split(' ')[0] || '',
                last_name: address.name.split(' ').slice(1).join(' ') || address.name,
                email: address.email,
                phone: address.phone.replace(/\s/g, ''), // Strip spaces
                address: {
                    street: address.street,
                    // InPost splits street/building number. Simple heuristic or just passing full street to street field (some APIs accept it)
                    // Better to clean this up, but for now passing as is.
                    building_number: '', 
                    city: address.city,
                    post_code: address.postalCode.replace('-', ''),
                    country_code: 'PL'
                }
            },
            parcels: [
                {
                    template: 'small', // Template A/Small for samples
                }
            ],
            service: 'inpost_courier_standard',
            reference: order.sourceOrderId || order.id
        });

        // 3. Update Order
        await db.update(orders).set({
            shippingCarrier: 'inpost',
            shippingTrackingNumber: shipment.tracking_number,
            status: 'order.fulfillment_confirmed'
        }).where(eq(orders.id, orderId));

        revalidatePath(`/dashboard/shop/orders/${orderId}`);

        return { 
            success: true, 
            trackingNumber: shipment.tracking_number,
            // In a real scenario, we might return a link to a proxy endpoint that calls getShipmentLabel
            // For now, returning the tracking number is the key success indicator
            labelUrl: null 
        };

    } catch (error: unknown) {
        console.error("InPost Error:", error);
        return {
            success: false,
            message: (error instanceof Error ? error.message : String(error)) || 'Błąd integracji InPost'
        };
    }
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
