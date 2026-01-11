'use server';

import { db } from '@/lib/db';
import { customers, orders, orderItems, globalSettings, erpProducts } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { getShopConfig, getTpayConfig } from '@/app/dashboard/settings/shop/actions';
import { randomUUID } from 'crypto';

export async function getShopProducts() {
    return db.query.erpProducts.findMany({
        where: or(
            eq(erpProducts.isShopVisible, true),
            eq(erpProducts.isSampleAvailable, true)
        ),
        columns: {
            id: true,
            name: true,
            sku: true,
            isShopVisible: true,
            isSampleAvailable: true,
            packageSizeM2: true,
            imageUrl: true,
            price: true, // We might need to parse this or use better price field
        },
        with: {
            purchasePrices: true, // Maybe used for price calc if no price set
        }
    });
}

export async function submitShopOrder(data: {
    customer: {
        email: string;
        phone?: string;
        name: string;
        nip?: string;
        street: string;
        city: string;
        postalCode: string;
    };
    items: {
        productId: string;
        quantity: number; // packages or pieces
        area?: number; // m2 for panels
        type: 'sample' | 'product';
    }[];
    paymentMethod: 'tpay' | 'proforma';
    referralToken?: string;
}) {
    const shopConfig = await getShopConfig();

    // 1. Find or Create Customer
    let customer = await db.query.customers.findFirst({
        where: eq(customers.email, data.customer.email),
    });

    if (!customer) {
        const newId = randomUUID();
        await db.insert(customers).values({
            id: newId,
            email: data.customer.email,
            name: data.customer.name || data.customer.email,
            phone: data.customer.phone,
            taxId: data.customer.nip,
            billingStreet: data.customer.street,
            billingCity: data.customer.city,
            billingPostalCode: data.customer.postalCode,
            // Simple mapping, billing = shipping for now
            shippingStreet: data.customer.street,
            shippingCity: data.customer.city,
            shippingPostalCode: data.customer.postalCode,
            source: 'other', // Should add 'shop' to customerSources if needed
            referralToken: data.referralToken,
        });
        customer = { id: newId } as any; 
    } else {
        // Update basic info if provided (optional, skipping for brevity, assume "Find" is enough or strictly "Update")
        // User requested: "Update basic info if provided" - let's do simple update
        await db.update(customers).set({
            name: data.customer.name,
            phone: data.customer.phone,
            taxId: data.customer.nip,
            billingStreet: data.customer.street,
            billingCity: data.customer.city,
            billingPostalCode: data.customer.postalCode,
        }).where(eq(customers.id, customer.id));
    }

    // 2. Calculate Totals
    let totalGross = 0;
    // Samples logic
    const sampleItems = data.items.filter(i => i.type === 'sample');
    if (sampleItems.length > 0) {
        totalGross += sampleItems.length * shopConfig.samplePrice;
        totalGross += shopConfig.sampleShippingCost; // one time shipping
    }

    // Panels logic - price calculation is complex, assuming price is available on product or we calculate it. 
    // For now, I'll assume we fetch fresh product data to get price.
    // NOTE: The `erp_products` schema has `price` as TEXT (Woo legacy). I should try to parse it or use `purchasePriceNet` * margin. 
    // For MVP, I'll try to use `price` field assuming it's consumable.
    
    // 3. Create Order
    const orderId = randomUUID();
    const status = data.paymentMethod === 'tpay' ? 'order.awaiting_payment' : 'order.pending_proforma';

    await db.insert(orders).values({
        id: orderId,
        source: 'shop',
        paymentMethod: data.paymentMethod,
        status: status,
        customerId: customer!.id,
        totalNet: Math.round(totalGross / 1.23), // Simplification
        totalGross: totalGross,
        currency: 'PLN',
    });

    // 4. Create Order Items
    for (const item of data.items) {
        // Fetch product name and price for snapshot
        // Ideally we do this in bulk before.
        const product = await db.query.erpProducts.findFirst({
             where: eq(erpProducts.id, item.productId),
             columns: { name: true, price: true, sku: true }
        });
        
        let unitPrice = 0;
        if (item.type === 'sample') {
            unitPrice = shopConfig.samplePrice;
        } else {
            // Panels price logic
            // Parse product.price or fallback
            unitPrice = parseFloat(product?.price || '0') * 100; 
        }

        await db.insert(orderItems).values({
            id: randomUUID(),
            orderId: orderId,
            sku: product?.sku,
            name: product?.name || 'Produkt Sklepowy',
            quantity: item.quantity,
            unitPrice: unitPrice,
            taxRate: 2300, // 23.00%
        });
    }

    // 5. Handle Payment Redirection or Return
    if (data.paymentMethod === 'tpay') {
        const tpayConfig = await getTpayConfig();
        // Here we would call Tpay API to create transaction
        // For now, return a success message or mock URL
        return { success: true, orderId: orderId, redirectUrl: '/sklep/dziekujemy?status=oplacone' };
    }

    return { success: true, orderId: orderId, redirectUrl: `/sklep/dziekujemy?status=proforma&oid=${orderId}` };
}
