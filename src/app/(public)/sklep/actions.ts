'use server';

import { db } from '@/lib/db';
import { customers, orders, orderItems, erpProducts, mailAccounts } from '@/lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';
import { getShopConfig } from '@/app/dashboard/settings/shop/actions';
import { randomUUID } from 'crypto';
import { createTransport } from 'nodemailer';

function decodeSecret(secret: string | null | undefined): string | null {
    if (!secret) return null;
    try {
        return Buffer.from(secret, 'base64').toString('utf-8');
    } catch {
        return null;
    }
}

export async function sendShopMagicLink(email: string) {
    if (!email || !email.includes('@')) {
        return { success: false, message: 'Nieprawidłowy adres email' };
    }

    try {
        // 1. Find or create customer
        let customer = await db.query.customers.findFirst({
            where: eq(customers.email, email),
        });

        let token = customer?.referralToken;

        if (!customer) {
            token = randomUUID();
            const inserted = await db.insert(customers).values({
                id: randomUUID(),
                email: email,
                name: email.split('@')[0], // Default name
                source: 'other', // or 'shop'
                referralToken: token,
            }).returning();
            customer = inserted[0];
        } else if (!token) {
            token = randomUUID();
            await db.update(customers)
                .set({ referralToken: token })
                .where(eq(customers.id, customer.id));
        }

        // 2. Prepare Email
        const link = `https://b2b.primepodloga.pl/sklep?token=${token}`;

        // 3. Find Mail Account
        const account = await db.query.mailAccounts.findFirst({
            where: eq(mailAccounts.status, 'connected'),
        });

        if (!account || !account.smtpHost || !account.smtpPort) {
            // Fallback for dev or error
            console.warn('No mail account configured. Magic Link:', link);
            return { success: true, debugLink: link }; 
        }

        const password = decodeSecret(account.passwordSecret);
        if (!password) {
            return { success: false, message: 'Błąd konfiguracji poczty (hasło)' };
        }

        const transporter = createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: Boolean(account.smtpSecure),
            auth: {
                user: account.username,
                pass: password,
            },
        });

        const html = `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2>Twój link do Sklepu Prime Podłoga</h2>
                <p>Kliknij poniższy przycisk, aby zalogować się do swojego panelu klienta w sklepie:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Przejdź do Sklepu
                    </a>
                </div>
                <p style="font-size: 12px; color: #666;">
                    Jeśli przycisk nie działa, skopiuj ten link: <br>
                    <a href="${link}">${link}</a>
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: `"${account.displayName}" <${account.email}>`,
            to: email,
            subject: 'Dostęp do Sklepu Prime Podłoga',
            html: html,
        });

        return { success: true };

    } catch (error) {
        console.error('Magic Link Error:', error);
        return { success: false, message: 'Wystąpił błąd podczas wysyłania linku.' };
    }
}

export async function getCustomerByToken(token: string) {
    if (!token) return null;
    return db.query.customers.findFirst({
        where: eq(customers.referralToken, token),
    });
}

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

    // Fix empty NIP causing unique key violation
    const nip = (data.customer.nip && data.customer.nip.trim().length > 0) ? data.customer.nip.trim() : null;

    // 1. Find or Create Customer
    let customer = await db.query.customers.findFirst({
        where: eq(customers.email, data.customer.email),
    });

    if (!customer) {
        const newId = randomUUID();
        const inserted = await db.insert(customers).values({
            id: newId,
            email: data.customer.email,
            name: data.customer.name || data.customer.email,
            phone: data.customer.phone,
            taxId: nip,
            billingStreet: data.customer.street,
            billingCity: data.customer.city,
            billingPostalCode: data.customer.postalCode,
            // Simple mapping, billing = shipping for now
            shippingStreet: data.customer.street,
            shippingCity: data.customer.city,
            shippingPostalCode: data.customer.postalCode,
            source: 'other', // Should add 'shop' to customerSources if needed
            referralToken: data.referralToken,
        }).returning();
        customer = inserted[0];
    } else {
        // Update basic info if provided (optional, skipping for brevity, assume "Find" is enough or strictly "Update")
        // User requested: "Update basic info if provided" - let's do simple update
        await db.update(customers).set({
            name: data.customer.name,
            phone: data.customer.phone,
            taxId: nip,
            billingStreet: data.customer.street,
            billingCity: data.customer.city,
            billingPostalCode: data.customer.postalCode,
        }).where(eq(customers.id, customer.id));
    }

    // Prefetch products
    const productIds = data.items.map(i => i.productId);
    // Dedup IDs
    const uniqueProductIds = Array.from(new Set(productIds));
    
    let productsMap = new Map<string, { id: string, name: string, price: string | null, sku: string | null }>();
    if (uniqueProductIds.length > 0) {
        const products = await db.query.erpProducts.findMany({
            where: inArray(erpProducts.id, uniqueProductIds),
            columns: { id: true, name: true, price: true, sku: true }
        });
        productsMap = new Map(products.map(p => [p.id, p]));
    }

    // 2. Calculate Totals
    let totalGross = 0;
    
    // Samples logic
    const sampleItems = data.items.filter(i => i.type === 'sample');
    if (sampleItems.length > 0) {
        totalGross += sampleItems.length * shopConfig.samplePrice;
        totalGross += shopConfig.sampleShippingCost; // one time shipping
    }

    // Panels logic
    const productItems = data.items.filter(i => i.type === 'product');
    for (const item of productItems) {
        const product = productsMap.get(item.productId);
        const unitPrice = parseFloat(product?.price || '0') * 100; 
        totalGross += unitPrice * item.quantity;
    }

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
        const product = productsMap.get(item.productId);
        
        let unitPrice = 0;
        if (item.type === 'sample') {
            unitPrice = shopConfig.samplePrice;
        } else {
            // Panels price logic
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
        // const tpayConfig = await getTpayConfig();
        // Here we would call Tpay API to create transaction
        // For now, return a success message or mock URL
        return { success: true, orderId: orderId, redirectUrl: '/sklep/dziekujemy?status=oplacone' };
    }

    return { success: true, orderId: orderId, redirectUrl: `/sklep/dziekujemy?status=proforma&oid=${orderId}` };
}
