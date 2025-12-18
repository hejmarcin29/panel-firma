'use server';

import { db } from '@/lib/db';
import { quotes, type QuoteItem, type QuoteStatus, mailAccounts, montages, products } from '@/lib/db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { createTransport } from 'nodemailer';
import { formatCurrency } from '@/lib/utils';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

function decodeSecret(secret: string | null | undefined): string | null {
    if (!secret) {
        return null;
    }

    try {
        return Buffer.from(secret, 'base64').toString('utf8');
    } catch {
        return null;
    }
}

export async function sendQuoteEmail(quoteId: string) {
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            montage: true,
        },
    });

    if (!quote) {
        throw new Error('Wycena nie znaleziona');
    }

    if (!quote.montage.contactEmail) {
        throw new Error('Klient nie ma adresu email');
    }

    // Find a mail account to send from (prefer enabled ones)
    const account = await db.query.mailAccounts.findFirst({
        where: eq(mailAccounts.status, 'connected'),
    });

    if (!account) {
        throw new Error('Brak skonfigurowanego konta pocztowego');
    }

    if (!account.smtpHost || !account.smtpPort) {
        throw new Error('Konto pocztowe nie ma konfiguracji SMTP');
    }

    const password = decodeSecret(account.passwordSecret);
    if (!password) {
        throw new Error('Błąd konfiguracji hasła SMTP');
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

    const [
        companyName,
        companyAddress,
        companyNip,
        companyBankName,
        companyBankAccount,
    ] = await Promise.all([
        getAppSetting(appSettingKeys.companyName),
        getAppSetting(appSettingKeys.companyAddress),
        getAppSetting(appSettingKeys.companyNip),
        getAppSetting(appSettingKeys.companyBankName),
        getAppSetting(appSettingKeys.companyBankAccount),
    ]);

    const itemsHtml = quote.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity} ${item.unit}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.priceNet)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.vatRate * 100}%</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.totalGross)}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
            <h2>Wycena #${quote.number || quote.id.slice(0, 8)}</h2>
            <p>Dzień dobry,</p>
            <p>Przesyłamy wycenę dla zlecenia: <strong>${quote.montage.clientName}</strong></p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Nazwa</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Ilość</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Cena netto</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">VAT</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Wartość brutto</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold;">Suma Netto:</td>
                        <td style="padding: 12px; text-align: right;">${formatCurrency(quote.totalNet)}</td>
                    </tr>
                    <tr>
                        <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold;">Suma Brutto:</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(quote.totalGross)}</td>
                    </tr>
                </tfoot>
            </table>

            ${quote.notes ? `<p><strong>Uwagi:</strong><br>${quote.notes}</p>` : ''}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p><strong>Dane sprzedawcy:</strong></p>
                <p>${companyName || ''}</p>
                <p>${companyAddress || ''}</p>
                <p>NIP: ${companyNip || ''}</p>
                ${companyBankName && companyBankAccount ? `
                    <p style="margin-top: 10px;">
                        <strong>Konto bankowe:</strong><br>
                        ${companyBankName}<br>
                        ${companyBankAccount}
                    </p>
                ` : ''}
            </div>
            
            <p>Z poważaniem,<br>${account.displayName}</p>
        </div>
    `;

    await transporter.sendMail({
        from: `${account.displayName} <${account.email}>`,
        to: quote.montage.contactEmail,
        subject: `Wycena #${quote.number || quote.id.slice(0, 8)} - ${quote.montage.clientName}`,
        html,
    });

    await db.update(quotes)
        .set({ status: 'sent' })
        .where(eq(quotes.id, quoteId));

    revalidatePath(`/dashboard/oferty/${quoteId}`);
    revalidatePath('/dashboard/oferty');
}

export async function getQuotes() {
    return await db.query.quotes.findMany({
        where: isNull(quotes.deletedAt),
        with: {
            montage: true,
            contract: true,
        },
        orderBy: [desc(quotes.createdAt)],
    });
}

export async function getQuote(id: string) {
    return await db.query.quotes.findFirst({
        where: eq(quotes.id, id),
        with: {
            montage: true,
            contract: true,
        },
    });
}

export async function createQuote(montageId: string) {
    const id = randomUUID();

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: {
            displayId: true,
        }
    });

    if (!montage) {
        throw new Error('Montaż nie istnieje');
    }

    const existingQuotes = await db.query.quotes.findMany({
        where: eq(quotes.montageId, montageId),
    });

    const quoteNumber = `${montage.displayId || 'M/UNKNOWN'}/W${existingQuotes.length + 1}`;

    await db.insert(quotes).values({
        id,
        montageId,
        number: quoteNumber,
        status: 'draft',
        items: [],
    });
    revalidatePath('/dashboard/oferty');
    revalidatePath(`/dashboard/montaze/${montageId}`);
    return id;
}

export async function updateQuote(id: string, data: {
    status?: QuoteStatus;
    items?: QuoteItem[];
    validUntil?: Date;
    notes?: string;
}) {
    // Calculate totals if items are updated
    const updates: Partial<typeof quotes.$inferInsert> = { ...data };
    
    if (data.items) {
        const totalNet = data.items.reduce((sum, item) => sum + item.totalNet, 0);
        const totalGross = data.items.reduce((sum, item) => sum + item.totalGross, 0);
        updates.totalNet = totalNet;
        updates.totalGross = totalGross;
    }

    await db.update(quotes).set({
        ...updates,
        updatedAt: new Date(),
    }).where(eq(quotes.id, id));

    revalidatePath('/dashboard/oferty');
    revalidatePath(`/dashboard/oferty/${id}`);
}

export async function deleteQuote(id: string) {
    await db.update(quotes)
        .set({ deletedAt: new Date() })
        .where(eq(quotes.id, id));
    revalidatePath('/dashboard/oferty');
}

export async function getMontagesForQuoteSelection() {
    const allMontages = await db.query.montages.findMany({
        where: isNull(montages.deletedAt),
        orderBy: [desc(montages.createdAt)],
        columns: {
            id: true,
            clientName: true,
            createdAt: true,
            status: true,
            displayId: true,
        }
    });

    const allQuotes = await db.query.quotes.findMany({
        columns: {
            montageId: true,
        }
    });

    const quoteMontageIds = new Set(allQuotes.map(q => q.montageId));

    return allMontages.map(m => ({
        ...m,
        hasQuote: quoteMontageIds.has(m.id)
    }));
}

export async function getProductsForQuote() {
    return await db.query.products.findMany({
        where: and(
            eq(products.status, 'publish'),
            isNull(products.deletedAt)
        ),
        columns: {
            id: true,
            name: true,
            price: true,
            attributes: true,
        }
    });
}
