'use server';

import { db } from '@/lib/db';
import { customers, montages, quotes, mailAccounts } from '@/lib/db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logSystemEvent } from '@/lib/logging';
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

export async function sendQuoteEmailToCustomer(quoteId: string, token: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            montage: true,
        },
    });

    if (!quote) throw new Error('Nie znaleziono wyceny');

    // Verify ownership
    const isOwner = customer.montages.some(m => m.id === quote.montageId);
    if (!isOwner) throw new Error('Brak uprawnień do tej wyceny');

    if (!quote.montage.contactEmail) {
        throw new Error('Brak adresu email w zamówieniu');
    }

    // Find a mail account to send from (prefer enabled ones)
    const account = await db.query.mailAccounts.findFirst({
        where: eq(mailAccounts.status, 'connected'),
    });

    if (!account) {
        throw new Error('Brak skonfigurowanego konta pocztowego w systemie');
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
            <h2>Potwierdzenie przyjęcia oferty #${quote.number || quote.id.slice(0, 8)}</h2>
            <p>Dzień dobry,</p>
            <p>Dziękujemy za zaakceptowanie oferty dla zlecenia: <strong>${quote.montage.clientName}</strong></p>
            <p>Poniżej przesyłamy szczegóły zamówienia:</p>
            
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
        subject: `Potwierdzenie oferty #${quote.number || quote.id.slice(0, 8)} - ${quote.montage.clientName}`,
        html,
    });

    return { success: true };
}

export async function signQuote(quoteId: string, signatureData: string, token: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            montage: true
        }
    });

    if (!quote) throw new Error('Nie znaleziono wyceny');

    // Verify ownership
    const isOwner = customer.montages.some(m => m.id === quote.montageId);
    if (!isOwner) throw new Error('Brak uprawnień do tej wyceny');

    if (quote.status === 'accepted') throw new Error('Wycena jest już zaakceptowana');

    // Update quote
    await db.update(quotes)
        .set({
            status: 'accepted',
            signedAt: new Date(),
            signatureData: signatureData,
            updatedAt: new Date()
        })
        .where(eq(quotes.id, quoteId));

    // Update montage with contract info
    if (quote.number) {
        await db.update(montages)
            .set({
                contractNumber: quote.number,
                contractDate: new Date(),
            })
            .where(eq(montages.id, quote.montageId));
    }

    // Log system event
    await logSystemEvent(
        'quote_signed',
        {
            quoteId: quote.id,
            quoteNumber: quote.number,
            customerId: customer.id,
            customerName: customer.name,
            montageId: quote.montageId
        },
        'system' // or customer.id if we want to track who triggered it, but userId usually refers to admin users
    );

    // TODO: Send email notification to admin/sales rep

    revalidatePath(`/s/${token}`);
    return { success: true };
}

interface MontageUpdateData {
    address?: string;
    city?: string;
    postalCode?: string;
    floorArea?: string | number;
    notes?: string;
}

export async function updateMontageData(montageId: string, data: MontageUpdateData, token: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const isOwner = customer.montages.some(m => m.id === montageId);
    if (!isOwner) throw new Error('Brak uprawnień');

    const currentMontage = customer.montages.find(m => m.id === montageId);
    
    await db.update(montages)
        .set({
            address: data.address,
            installationCity: data.city,
            installationPostalCode: data.postalCode,
            estimatedFloorArea: data.floorArea ? parseFloat(data.floorArea.toString()) : null,
            floorArea: null,
            additionalInfo: data.notes,
            // Auto-advance status if it's a lead
            status: currentMontage?.status === 'new_lead' ? 'measurement_scheduled' : undefined,
            updatedAt: new Date()
        })
        .where(eq(montages.id, montageId));

    // Log system event if status changed
    if (currentMontage?.status === 'new_lead') {
        await logSystemEvent(
            'montage.status_changed',
            `Klient uzupełnił dane - automatyczna zmiana statusu na Przed Pomiarem (ID: ${montageId})`,
            'system'
        );
    }

    revalidatePath(`/s/${token}`);
    return { success: true };
}

export async function acceptInstallationDate(montageId: string, token: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const isOwner = customer.montages.some(m => m.id === montageId);
    if (!isOwner) throw new Error('Brak uprawnień');

    await db.update(montages)
        .set({ installationDateConfirmed: true })
        .where(eq(montages.id, montageId));

    revalidatePath(`/s/${token}`);
    return { success: true };
}

export async function rejectInstallationDate(montageId: string, token: string, reason: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const isOwner = customer.montages.some(m => m.id === montageId);
    if (!isOwner) throw new Error('Brak uprawnień');

    // Log rejection (in a real app, send email/sms to admin)
    console.log(`Customer rejected date for montage ${montageId}. Reason: ${reason}`);

    revalidatePath(`/s/${token}`);
    return { success: true };
}

export async function getCustomerByToken(token: string) {
    const customer = await db.query.customers.findFirst({
        where: eq(customers.referralToken, token),
        with: {
            montages: {
                where: (montages, { isNull }) => isNull(montages.deletedAt),
                orderBy: [desc(montages.createdAt)],
                with: {
                    attachments: true,
                    quotes: {
                        orderBy: [desc(quotes.createdAt)],
                    }
                }
            }
        }
    });

    if (!customer) return undefined;

    // Fallback: Find unlinked montages by email
    if (customer.email) {
        const montagesByEmail = await db.query.montages.findMany({
            where: and(
                eq(montages.contactEmail, customer.email),
                isNull(montages.deletedAt)
            ),
            orderBy: [desc(montages.createdAt)],
            with: {
                attachments: true,
                quotes: {
                    orderBy: [desc(quotes.createdAt)],
                }
            }
        });

        const existingIds = new Set(customer.montages.map(m => m.id));
        const allMontages = [...customer.montages];

        for (const m of montagesByEmail) {
            if (!existingIds.has(m.id)) {
                allMontages.push(m);
            }
        }

        // Sort by date desc
        allMontages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return {
            ...customer,
            montages: allMontages
        };
    }

    return customer;
}


