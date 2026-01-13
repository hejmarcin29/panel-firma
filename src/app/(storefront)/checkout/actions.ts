'use server';

import { db } from '@/lib/db';
import { manualOrders, manualOrderItems } from '@/lib/db/schema';
import { format } from 'date-fns';

type OrderData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    
    street: string;
    postalCode: string;
    city: string;
    
    isCompany: boolean;
    companyName?: string;
    nip?: string;
    
    differentBillingAddress: boolean;
    billingStreet?: string;
    billingPostalCode?: string;
    billingCity?: string;

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
    const reference = generateOrderReference();

    // 2. Billing Data logic
    const billingName = data.isCompany && data.companyName ? data.companyName : `${data.firstName} ${data.lastName}`;
    const billingStreet = data.differentBillingAddress && data.billingStreet ? data.billingStreet : data.street;
    const billingCity = data.differentBillingAddress && data.billingCity ? data.billingCity : data.city;
    const billingPostalCode = data.differentBillingAddress && data.billingPostalCode ? data.billingPostalCode : data.postalCode;
    
    // 3. Prepare Order Object
    // Values stored in integers (GROSZE)
    const totalGross = Math.round(data.totalAmount * 100);
    // Rough Net calc (assuming mixed VAT, but totalNet is sum of items usually)
    
    // 4. Create Order DB Record
    const orderId = crypto.randomUUID();

    let totalNet_calc = 0;
    
    // Prepare items for DB
    const dbItems = data.items.map(item => {
        const itemGross = Math.round(item.price * item.quantity * 100);
        const itemNet = Math.round(itemGross / (1 + item.vatRate));
        totalNet_calc += itemNet;

        return {
            id: crypto.randomUUID(),
            orderId: orderId,
            product: item.name + (item.sku ? ` (${item.sku})` : ''),
            quantity: item.quantity, // This might be packs or pieces. For samples it's pieces.
            unitPrice: Math.round(item.price * 100),
            vatRate: Math.round(item.vatRate * 100),
            totalNet: itemNet,
            totalGross: itemGross
        }
    });

    try {
        await db.transaction(async (tx) => {
            await tx.insert(manualOrders).values({
                id: orderId,
                reference: reference,
                status: 'order.received',
                channel: 'shop',
                source: 'shop',
                type: data.items.some(i => i.productId.startsWith('sample_')) ? 'sample' : 'production',
                
                totalNet: totalNet_calc,
                totalGross: totalGross,
                currency: 'PLN',
                
                // Billing (InvoicE)
                billingName: billingName + (data.isCompany && data.nip ? ` (NIP: ${data.nip})` : ''),
                billingStreet: billingStreet,
                billingPostalCode: billingPostalCode,
                billingCity: billingCity,
                billingEmail: data.email,
                billingPhone: data.phone,
                
                // Shipping
                shippingSameAsBilling: !data.differentBillingAddress,
                shippingName: `${data.firstName} ${data.lastName}`,
                shippingStreet: data.street,
                shippingPostalCode: data.postalCode,
                shippingCity: data.city,
                shippingPhone: data.phone,
                shippingEmail: data.email,
                
                paymentMethod: data.paymentMethod,
                requiresReview: true, // Always require review for now
                notes: `Zamówienie ze sklepu. ${data.isCompany ? 'Faktura VAT' : 'Paragon'}.`
            });

            if (dbItems.length > 0) {
                await tx.insert(manualOrderItems).values(dbItems);
            }
        });

        // 5. Handle Tpay Redirect (Mock for now)
        const redirectUrl = null;
        if (data.paymentMethod === 'tpay') {
             // In real impl, we would hit Tpay API here
             // redirectUrl = await createTpayTransaction(...)
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
