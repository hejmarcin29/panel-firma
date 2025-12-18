'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { contractTemplates, contracts, quotes, montages, customers } from '@/lib/db/schema';
import { logSystemEvent } from '@/lib/logging';

// --- TEMPLATES ---

export async function getContractTemplates() {
    await requireUser();
    return await db.query.contractTemplates.findMany({
        orderBy: [desc(contractTemplates.createdAt)],
    });
}

export async function createContractTemplate(data: { name: string; content: string; isDefault: boolean }) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    if (data.isDefault) {
        // Unset other defaults
        await db.update(contractTemplates).set({ isDefault: false });
    }

    await db.insert(contractTemplates).values({
        id: nanoid(),
        name: data.name,
        content: data.content,
        isDefault: data.isDefault,
    });

    revalidatePath('/dashboard/settings');
}

export async function updateContractTemplate(id: string, data: { name: string; content: string; isDefault: boolean }) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    if (data.isDefault) {
        await db.update(contractTemplates).set({ isDefault: false });
    }

    await db.update(contractTemplates)
        .set({
            name: data.name,
            content: data.content,
            isDefault: data.isDefault,
            updatedAt: new Date(),
        })
        .where(eq(contractTemplates.id, id));

    revalidatePath('/dashboard/settings');
}

export async function deleteContractTemplate(id: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    await db.delete(contractTemplates).where(eq(contractTemplates.id, id));
    revalidatePath('/dashboard/settings');
}

// --- CONTRACTS ---

export async function getContractForQuote(quoteId: string) {
    await requireUser();
    return await db.query.contracts.findFirst({
        where: eq(contracts.quoteId, quoteId),
    });
}

export async function generateContract(quoteId: string, templateId: string, variables: Record<string, string>) {
    const user = await requireUser();
    
    const template = await db.query.contractTemplates.findFirst({
        where: eq(contractTemplates.id, templateId),
    });

    if (!template) throw new Error('Szablon nie istnieje');

    // Fetch context data
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            montage: {
                with: {
                    customer: true
                }
            }
        }
    });

    if (!quote) throw new Error('Wycena nie istnieje');

    // Replace placeholders
    let content = template.content;
    
    // System variables
    const systemVariables: Record<string, string> = {
        '{{klient_nazwa}}': quote.montage.clientName,
        '{{klient_adres}}': quote.montage.address || '',
        '{{klient_email}}': quote.montage.contactEmail || '',
        '{{klient_telefon}}': quote.montage.contactPhone || '',
        '{{numer_wyceny}}': quote.number || '',
        '{{data_wyceny}}': quote.createdAt.toLocaleDateString('pl-PL'),
        '{{kwota_netto}}': (quote.totalNet / 100).toFixed(2),
        '{{kwota_brutto}}': (quote.totalGross / 100).toFixed(2),
        '{{adres_montazu}}': quote.montage.installationAddress || quote.montage.address || '',
    };

    // Merge system and user variables
    const allVariables = { ...systemVariables, ...variables };

    for (const [key, value] of Object.entries(allVariables)) {
        content = content.replace(new RegExp(key, 'g'), value);
    }

    // Create or Update Contract
    const existingContract = await db.query.contracts.findFirst({
        where: eq(contracts.quoteId, quoteId),
    });

    if (existingContract) {
        await db.update(contracts).set({
            templateId,
            content,
            variables,
            status: 'draft',
            updatedAt: new Date(),
        }).where(eq(contracts.id, existingContract.id));
    } else {
        await db.insert(contracts).values({
            id: nanoid(),
            quoteId,
            templateId,
            content,
            variables,
            status: 'draft',
        });
    }

    revalidatePath(`/dashboard/wyceny/${quoteId}`);
}

export async function updateContractContent(contractId: string, content: string) {
    const user = await requireUser();
    
    await db.update(contracts)
        .set({ content, updatedAt: new Date() })
        .where(eq(contracts.id, contractId));
        
    revalidatePath('/dashboard/wyceny');
}

export async function sendContract(contractId: string) {
    const user = await requireUser();
    
    await db.update(contracts)
        .set({ status: 'sent', updatedAt: new Date() })
        .where(eq(contracts.id, contractId));

    // Here we would trigger email sending logic
    
    revalidatePath('/dashboard/wyceny');
}
