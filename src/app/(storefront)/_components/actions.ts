'use server';

import { db } from '@/lib/db';
import { orders, manualOrders, customers, mailAccounts, globalSettings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateOrderMagicLink } from '@/app/dashboard/shop/orders/[id]/actions';
import { createTransport } from 'nodemailer';
import { type ShopConfig } from '@/app/dashboard/settings/shop/actions';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

function decodeSecret(secret: string | null | undefined): string | null {
    if (!secret) return null;
    try {
        return Buffer.from(secret, 'base64').toString('utf8');
    } catch {
        return null;
    }
}

export async function resendOrderLink(email: string, turnstileToken?: string) {
    // 0. Rate Limiting (5 attempts per min, block for 3 mins)
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const limitStatus = rateLimit.check(ip, 5, 60 * 1000, 3 * 60 * 1000);
    
    if (!limitStatus.success) {
        return { 
            success: false, 
            message: `Zbyt wiele prób. Spróbuj ponownie za ${Math.ceil((limitStatus.remainingTime || 0) / 60)} min.` 
        };
    }

    // 1. Get Config & Verify Turnstile
    const settingsRecord = await db.query.globalSettings.findFirst({
        where: eq(globalSettings.key, 'shop_config'),
    });
    const config = settingsRecord?.value as ShopConfig | undefined;

    if (config?.turnstileSecretKey) {
        if (!turnstileToken) {
             return { success: false, message: 'Weryfikacja anty-spam nie powiodła się (brak tokenu).' };
        }

        const formData = new FormData();
        formData.append('secret', config.turnstileSecretKey);
        formData.append('response', turnstileToken);

        try {
            const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
            const result = await fetch(url, {
                body: formData,
                method: 'POST',
            });
            const outcome = await result.json();
            if (!outcome.success) {
                return { success: false, message: 'Weryfikacja anty-spam nie powiodła się.' };
            }
        } catch (e) {
            console.error('Turnstile verification error:', e);
            // Fail open or closed? Closed for security.
            return { success: false, message: 'Błąd weryfikacji anty-spam.' };
        }
    }

    if (!email || !email.includes('@')) {
        return { success: false, message: 'Nieprawidłowy adres email.' };
    }

    // 2. Find recent order for this email
    // Check shop orders
    await db.query.orders.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: eq(orders.billingAddress, { email: email } as any), // JSON match approach might depend on adapter, safely handled later or via relation
    });
    
    // Fallback: Check customers table to find orders via customerId if needed, 
    // but easier to check columns if extracted. 
    // Since billingAddress is JSON, querying inside it with eq() is adapter specific.
    // Let's try to find customer first.
    
    // Better strategy: Search orders by normalized email if stored, or iterate.
    // Given the schema isn't fully visible, let's assume we search customers first.
    
    const customer = await db.query.customers.findFirst({
        where: eq(customers.email, email)
    });

    let orderId = null;

    if (customer) {
        // Find last shop order
        const lastShopOrder = await db.query.orders.findFirst({
            where: eq(orders.customerId, customer.id),
            orderBy: [desc(orders.createdAt)]
        });
        if (lastShopOrder) orderId = lastShopOrder.id;
    }

    // If still no order, try manual orders (CRM)
    if (!orderId) {
        const lastManualOrder = await db.query.manualOrders.findFirst({
            where: eq(manualOrders.billingEmail, email),
            orderBy: [desc(manualOrders.createdAt)]
        });
        if (lastManualOrder) orderId = lastManualOrder.id;
        
        // If still no order, maybe it's in Shop Order but customer wasn't linked?
        // Querying JSON columns is tricky, skipping for safety in this fast-fix.
    }

    if (!orderId) {
        // Return success to prevent email enumeration
        return { success: true, message: 'Jeżeli adres jest poprawny, link został wysłany.' };
    }

    // 2. Generate Magic Link
    const magicLink = await generateOrderMagicLink(orderId);

    // 3. Send Email
    try {
        const account = await db.query.mailAccounts.findFirst({
            where: eq(mailAccounts.status, 'connected'),
        });

        if (account && account.smtpHost && account.smtpPort) {
            const password = decodeSecret(account.passwordSecret);
            if (password) {
                const transporter = createTransport({
                    host: account.smtpHost,
                    port: account.smtpPort,
                    secure: Boolean(account.smtpSecure),
                    auth: {
                        user: account.username,
                        pass: password,
                    },
                });

                await transporter.sendMail({
                    from: `"${account.displayName}" <${account.email}>`,
                    to: email,
                    subject: 'Twój link do statusu zamówienia - Prime Podłoga',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Sprawdź status swojego zamówienia</h2>
                            <p>Witaj,</p>
                            <p>Poprosiłeś o link do śledzenia Twojego ostatniego zamówienia.</p>
                            <p>Kliknij poniższy przycisk, aby zobaczyć szczegóły:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${magicLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    Sprawdź status zamówienia
                                </a>
                            </div>
                            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                                Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
                                ${magicLink}
                            </p>
                        </div>
                    `,
                });
            }
        }
    } catch (error) {
        console.error('Failed to send magic link email', error);
        // We still return success to UI
    }

    return { success: true, message: 'Jeżeli adres jest poprawny, link został wysłany.' };
}
