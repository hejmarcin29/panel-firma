'use server';

import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { createPayment } from '@/lib/tpay';

type OrderData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    
    street: string;
    postalCode: string;
    city: string;
    country?: string;
    
    isCompany: boolean;
    companyName?: string;
    nip?: string;
    
    differentBillingAddress: boolean;
    billingStreet?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingCountry?: string;

    paymentMethod: "proforma" | "tpay";
    items: {
        productId: string;
        name: string;
        sku: string;
        quantity: number;
        price: number;
        vatRate: number;
        unit: string;
    }[];
    totalAmount: number;
};

// Simple ID Generator: ORDER-YYYYMMDD-XXXX
function generateOrderReference() {
    const date = new Date();
    const dateStr = format(date, 'yyyyMMdd');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `WEB-${dateStr}-${random}`;
}

export async function processOrder(data: OrderData) {
    // 1. Generate Order Reference
    const reference = generateOrderReference(); // Could be used as sourceOrderId or just visible ID if needed

    // 2. Prepare Snapshot Data
    const billingAddress = {
        name: data.isCompany && data.companyName ? data.companyName : `${data.firstName} ${data.lastName}`,
        street: data.differentBillingAddress && data.billingStreet ? data.billingStreet : data.street,
        city: data.differentBillingAddress && data.billingCity ? data.billingCity : data.city,
        postalCode: data.differentBillingAddress && data.billingPostalCode ? data.billingPostalCode : data.postalCode,
        country: data.differentBillingAddress && data.billingCountry ? data.billingCountry : (data.country || 'PL'),
        email: data.email,
        phone: data.phone,
        taxId: data.isCompany ? data.nip : undefined,
    };

    const shippingAddress = {
        name: `${data.firstName} ${data.lastName}`,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country || 'PL',
        phone: data.phone,
        email: data.email,
    };

    // 3. Totals
    const totalGross = Math.round(data.totalAmount * 100);
    
    const dbItems = data.items.map(item => {
        const itemGross = Math.round(item.price * item.quantity * 100);
        const itemNet = Math.round(itemGross / (1 + item.vatRate));
        return {
            id: crypto.randomUUID(),
            name: item.name,
            sku: item.sku || item.productId,
            quantity: item.quantity,
            unitPrice: Math.round(item.price * 100), // Storing Gross as base or calculating back? Let's assume input price is Gross.
            taxRate: Math.round(item.vatRate * 100),
            totalNet: itemNet,
            totalGross: itemGross
        }
    });

    // Recalculate Totals
    const itemsTotalGross = dbItems.reduce((acc, i) => acc + i.totalGross, 0);
    const itemsTotalNet = dbItems.reduce((acc, i) => acc + i.totalNet, 0);
    const shippingCost = totalGross - itemsTotalGross; // Difference is shipping
    const shippingNet = Math.round(shippingCost / 1.23); // Assume 23% VAT for shipping

    const totalNet = itemsTotalNet + shippingNet;

    // 4. Order Type
    const orderType = data.items.some(i => i.productId.startsWith('sample_')) ? 'sample' : 'production';

    const orderId = crypto.randomUUID();

    try {
        await db.transaction(async (tx) => {
            // A. Customer Logic
            let customerId: string | null = null;
            const existingCustomer = await tx.query.customers.findFirst({
                where: eq(customers.email, data.email)
            });

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                customerId = crypto.randomUUID();
                await tx.insert(customers).values({
                    id: customerId,
                    email: data.email,
                    name: `${data.firstName} ${data.lastName}`,
                    phone: data.phone,
                    taxId: data.nip,
                    // Default addresses from this order
                    billingStreet: billingAddress.street,
                    billingCity: billingAddress.city,
                    billingPostalCode: billingAddress.postalCode,
                    shippingStreet: shippingAddress.street,
                    shippingCity: shippingAddress.city,
                    shippingPostalCode: shippingAddress.postalCode,
                    source: 'internet'
                });
            }

            // B. Order Insert
            await tx.insert(orders).values({
                id: orderId,
                source: 'shop',
                sourceOrderId: reference, // Display ID
                status: 'order.received',
                type: orderType,
                customerId: customerId,
                
                totalNet: totalNet,
                totalGross: totalGross,
                currency: 'PLN',
                
                paymentMethod: data.paymentMethod,
                
                billingAddress: billingAddress,
                shippingAddress: shippingAddress,
                
                shippingCost: shippingCost,
                
                notes: data.isCompany ? 'Faktura VAT' : 'Paragon',
            });

            // C. Items Insert
            if (dbItems.length > 0) {
                await tx.insert(orderItems).values(
                    dbItems.map(item => ({
                        id: item.id,
                        orderId: orderId,
                        sku: item.sku,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: Math.round(item.totalNet / item.quantity), // Store Net Unit Price
                        taxRate: item.taxRate
                    }))
                );
            }
        });

        // 5. Tpay
        let redirectUrl: string | null = null;
        if (data.paymentMethod === 'tpay') {
             try {
                 const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl';
                 const transaction = await createPayment({
                     amount: totalGross,
                     description: `Zamówienie ${reference}`,
                     crc: `ORDER_${orderId}`, // Uses ORDER_ prefix. Webhook must handle this.
                     email: data.email,
                     name: `${data.firstName} ${data.lastName}`,
                     returnUrl: `${appUrl}/sklep/dziekujemy?orderId=${orderId}`,
                 });
                 redirectUrl = transaction.url;
             } catch (error) {
                 console.error('Failed to create Tpay transaction:', error);
                 // Don't fail the order, just return success with no redirect
             }
        }

        return {
            success: true,
            orderId: orderId,
            reference: reference,
            redirectUrl: redirectUrl
        };

    } catch (error) {
        console.error('Order creation error:', error);
        return {
            success: false,
            message: 'Błąd podczas zapisywania zamówienia.'
        };
    }
}
