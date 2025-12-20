'use server';

import { db } from '@/lib/db';
import { customers, montages, quotes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logSystemEvent } from '@/lib/logging';

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

    await db.update(montages)
        .set({
            address: data.address,
            installationCity: data.city,
            installationPostalCode: data.postalCode,
            floorArea: data.floorArea ? parseFloat(data.floorArea.toString()) : null,
            additionalInfo: data.notes,
            updatedAt: new Date()
        })
        .where(eq(montages.id, montageId));

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
            where: eq(montages.contactEmail, customer.email),
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


