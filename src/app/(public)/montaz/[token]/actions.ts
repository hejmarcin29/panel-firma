'use server';

import { db } from '@/lib/db';
import { customers, montages, quotes, mailAccounts, montageAttachments, montagePayments, erpProducts, montageNotes, systemLogs } from '@/lib/db/schema';
import { eq, desc, isNull, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logSystemEvent } from '@/lib/logging';
import { createTransport } from 'nodemailer';
import { formatCurrency } from '@/lib/utils';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { uploadSignedContract } from '@/lib/r2/storage';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';

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

    // Automation: Move to 'contract_signed' if in valid previous stage
    const allowedPreviousStatuses = ['measurement_done', 'quote_in_progress', 'quote_sent', 'quote_accepted'];
    if (allowedPreviousStatuses.includes(quote.montage.status)) {
        await db.update(montages)
            .set({ status: 'contract_signed' })
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
        'system'
    );

    revalidatePath(`/montaz/${token}`);
    return { success: true };
}

interface MontageUpdateData {
    address?: string;
    city?: string;
    postalCode?: string;
    floorArea?: string | number;
    notes?: string;
    // Billing Data
    isCompany?: boolean;
    companyName?: string;
    nip?: string;
    billingAddress?: string;
    billingCity?: string;
    billingPostalCode?: string;
    isHousingVat?: boolean;
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
            installationAddress: data.address, // Sync with Admin Panel
            installationCity: data.city,
            installationPostalCode: data.postalCode,
            estimatedFloorArea: data.floorArea ? parseFloat(data.floorArea.toString()) : null,
            additionalInfo: data.notes,
            
            // Billing
            isCompany: data.isCompany ?? false,
            companyName: data.companyName,
            nip: data.nip,
            billingAddress: data.billingAddress,
            billingCity: data.billingCity,
            billingPostalCode: data.billingPostalCode,
            isHousingVat: data.isHousingVat ?? false,

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

    revalidatePath(`/montaz/${token}`);
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

    revalidatePath(`/montaz/${token}`);
    return { success: true };
}

export async function rejectInstallationDate(montageId: string, token: string, reason: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const isOwner = customer.montages.some(m => m.id === montageId);
    if (!isOwner) throw new Error('Brak uprawnień');

    console.log(`Customer rejected date for montage ${montageId}. Reason: ${reason}`);

    revalidatePath(`/montaz/${token}`);
    return { success: true };
}

export async function getCustomerByToken(token: string) {
    // 1. Try Finding Customer by Referral Token
    const customer = await db.query.customers.findFirst({
        where: eq(customers.referralToken, token),
        with: {
            montages: {
                where: (montages, { isNull }) => isNull(montages.deletedAt),
                orderBy: [desc(montages.createdAt)],
                with: {
                    attachments: true,
                    payments: {
                        orderBy: [desc(montagePayments.createdAt)],
                    },
                    quotes: {
                        orderBy: [desc(quotes.createdAt)],
                    }
                }
            }
        }
    });

    if (customer) {
        // Fallback checks (email linking) preserved from original code if needed...
        // For simplicity, assuming direct link for now as in original code.
        return customer;
    }

    // 2. Fallback: Try Finding Montage by Access Token (Lead View)
    // If we find a montage, we wrap it in a "Virtual Customer" structure
    const montage = await db.query.montages.findFirst({
        where: and(
            eq(montages.accessToken, token),
            isNull(montages.deletedAt)
        ),
        with: {
            attachments: true,
            payments: {
                orderBy: [desc(montagePayments.createdAt)],
            },
            quotes: {
                orderBy: [desc(quotes.createdAt)],
            }
        }
    });

    if (montage) {
        // Create Virtual Customer
        return {
            id: 'virtual-guest',
            name: montage.clientName,
            email: montage.contactEmail,
            phone: montage.contactPhone,
            referralToken: token, 
            createdAt: montage.createdAt,
            updatedAt: montage.updatedAt,
            // ... other customer fields if needed, filled with null/defaults
            montages: [montage]
        } as any; // Cast to any to match Customer type loosely or defined interface
    }

    return undefined;
}

export async function saveSignedContract(token: string, formData: FormData) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');
    
    const file = formData.get('file') as File;
    const sendEmail = formData.get('sendEmail') === 'true';
    const montageId = formData.get('montageId') as string;

    if (!file || !montageId) throw new Error('Brak pliku lub ID montażu');

    // Verify ownership
    const isOwner = customer.montages.some(m => m.id === montageId);
    if (!isOwner) throw new Error('Brak uprawnień do tego montażu');

    // Upload to R2
    const url = await uploadSignedContract({ montageId, file });

    // Save to DB
    await db.insert(montageAttachments).values({
        id: nanoid(),
        montageId,
        type: 'contract',
        title: 'Podpisana umowa',
        url,
        uploadedBy: null, // System/Customer uploaded
    });

    if (sendEmail) {
        await sendContractEmail(montageId, file);
    }

    revalidatePath(`/montaz/${token}`);
    return { success: true };
}


// --- SAMPLES ACTIONS ---

export async function getAvailableSamples() {
    return await db.query.erpProducts.findMany({
        where: eq(erpProducts.isSample, true),
        columns: {
            id: true,
            name: true,
            sku: true,
            description: true,
            imageUrl: true,
        }
    });
}

export async function submitSampleRequest(
    token: string, 
    productIds: string[],
    delivery: {
        method: 'courier' | 'parcel_locker';
        recipient: {
            name: string;
            email: string;
            phone: string;
        };
        pointName?: string;
        pointAddress?: string;
        address?: {
            street: string;
            buildingNumber: string;
            city: string;
            postalCode: string;
        };
    }
) {
    // 1. Resolve which montage to update
    const customer = await getCustomerByToken(token);
    
    // We assume the active montage is the first one (most recent) or the one that triggered this.
    // In "Virtual Customer" (Lead) case, it is the only montage.
    // In Real Customer case, we default to the most recent one.
    const montage = customer?.montages?.[0]; // Best effort

    if (!montage) throw new Error('Twoja sesja wygasła lub jest nieprawidłowa.');

    // 2. Resolve Products
    const selectedProducts = await db.query.erpProducts.findMany({
        where: (table, { inArray }) => inArray(table.id, productIds)
    });

    if (selectedProducts.length === 0) throw new Error('Nie wybrano produktów.');

    // 3. Format Note
    const sampleList = selectedProducts.map(p => `- ${p.name} (${p.sku})`).join('\n');
    
    let deliveryNote = '';
    const { method, recipient, address, pointName, pointAddress } = delivery;

    if (method === 'parcel_locker') {
        deliveryNote = `\n[DOSTAWA: PACZKOMAT]\nPunkt: ${pointName} (${pointAddress})\nDla: ${recipient.name}, ${recipient.phone}, ${recipient.email}`;
    } else {
        deliveryNote = `\n[DOSTAWA: KURIER]\nAdres: ${address?.street} ${address?.buildingNumber}, ${address?.postalCode} ${address?.city}\nDla: ${recipient.name}, ${recipient.phone}, ${recipient.email}`;
    }

    // Update Sample Delivery Info ONLY
    const deliveryWithProducts = {
        ...delivery,
        products: selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku ?? undefined
        }))
    };

    await db.update(montages)
        .set({
            status: 'lead_samples_pending',
            sampleStatus: 'to_send',
            sampleDelivery: deliveryWithProducts,
            updatedAt: new Date()
        })
        .where(eq(montages.id, montage.id));

    // Add explicit note to timeline
    await db.insert(montageNotes).values({
        id: randomUUID(),
        montageId: montage.id,
        content: `[ZAMÓWIENIE PRÓBEK]:\n${sampleList}${deliveryNote}`,
        isInternal: false,
        createdAt: new Date()
    });

    // Log event
    await db.insert(systemLogs).values({
        id: randomUUID(),
        action: 'sample_request',
        details: `Klient zamówił ${selectedProducts.length} próbek dla montażu ${montage.id}`,
        createdAt: new Date()
    });
    
    revalidatePath(`/montaz/${token}`);
    return { success: true };
}
