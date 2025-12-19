'use server';

import { db } from '@/lib/db';
import { customers, montages, quotes, contracts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function acceptQuote(quoteId: string, token: string) {
    // 1. Verify token belongs to the customer who owns the montage of the quote
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

    if (quote.status !== 'sent') throw new Error('Tej wyceny nie można już zaakceptować');

    // 2. Update status
    await db.update(quotes)
        .set({ 
            status: 'accepted',
            updatedAt: new Date()
        })
        .where(eq(quotes.id, quoteId));

    // 3. Update montage with contract info
    if (quote.number) {
        await db.update(montages)
            .set({ 
                contractNumber: quote.number,
                contractDate: new Date(),
                // status: 'before_first_payment' // Optional: automate status change
            })
            .where(eq(montages.id, quote.montageId));
    }

    revalidatePath(`/s/${token}`);
    return { success: true };
}

export async function signContract(contractId: string, signatureData: string, token: string) {
    const customer = await getCustomerByToken(token);
    if (!customer) throw new Error('Nieprawidłowy token');

    const contract = await db.query.contracts.findFirst({
        where: eq(contracts.id, contractId),
        with: {
            quote: true
        }
    });

    if (!contract) throw new Error('Nie znaleziono umowy');

    // Verify ownership via quote -> montage -> customer
    const isOwner = customer.montages.some(m => m.id === contract.quote.montageId);
    if (!isOwner) throw new Error('Brak uprawnień do tej umowy');

    if (contract.status === 'signed') throw new Error('Umowa jest już podpisana');

    await db.update(contracts)
        .set({
            status: 'signed',
            signedAt: new Date(),
            signatureData: signatureData,
            updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId));

    // Automatically accept the quote if it's not already accepted
    if (contract.quote && contract.quote.status === 'sent') {
        await db.update(quotes)
            .set({ 
                status: 'accepted',
                updatedAt: new Date()
            })
            .where(eq(quotes.id, contract.quoteId));
    }

    // Update montage with contract info
    if (contract.quote && contract.quote.number) {
        await db.update(montages)
            .set({
                contractNumber: contract.quote.number,
                contractDate: new Date(),
            })
            .where(eq(montages.id, contract.quote.montageId));
    }

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
                        with: {
                            contract: true
                        }
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
                    with: {
                        contract: true
                    }
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


