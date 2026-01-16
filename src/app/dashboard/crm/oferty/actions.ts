'use server';

import { db } from '@/lib/db';
import { quotes, type QuoteItem, type QuoteStatus, montages, services } from '@/lib/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
// import { createTransport } from 'nodemailer';
import { formatCurrency } from '@/lib/utils';
// import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getCurrentSession } from '@/lib/auth/session';
import { sendNotification } from '@/lib/notifications/service';



export async function sendQuoteEmail(quoteId: string) {
    const session = await getCurrentSession();
    if (!session || (session.user.roles.includes('installer') && !session.user.roles.includes('admin'))) {
        throw new Error('Unauthorized');
    }

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

    // 🔔 Notifications (Centralized)
    // We delegate the email generation to the notification service.
    // The detailed HTML table is replaced by the template in settings.
    const quoteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl'}/preview/quote/${quote.id}`;
    
    await sendNotification(
        'QUOTE_SENT',
        quote.montage.contactEmail,
        {
            quote_number: quote.number || quote.id.slice(0, 8),
            client_name: quote.montage.clientName || 'Klient',
            total_amount: formatCurrency(quote.totalGross),
            quote_link: quoteLink
        },
        { id: quote.id, type: 'quote' }
    );

    await db.update(quotes)
        .set({ status: 'sent' })
        .where(eq(quotes.id, quoteId));

    // Automation: Move to 'quote_sent' if currently 'quote_in_progress' or 'measurement_done'
    if (['quote_in_progress', 'measurement_done'].includes(quote.montage.status)) {
        await db.update(montages)
            .set({ status: 'quote_sent' })
            .where(eq(montages.id, quote.montageId));
    }

    revalidatePath(`/dashboard/crm/oferty/${quoteId}`);
    revalidatePath('/dashboard/crm/oferty');
}

export async function getQuotes() {
    const session = await getCurrentSession();
    if (!session) return [];

    // Installers should not see quotes
    if (session.user.roles.includes('installer') && !session.user.roles.includes('admin')) {
        return [];
    }

    return await db.query.quotes.findMany({
        where: isNull(quotes.deletedAt),
        with: {
            montage: true,
        },
        orderBy: [desc(quotes.createdAt)],
    });
}

export async function getQuote(id: string) {
    const session = await getCurrentSession();
    if (!session) return undefined;

    // Installers should not see quotes
    if (session.user.roles.includes('installer') && !session.user.roles.includes('admin')) {
        return undefined;
    }

    return await db.query.quotes.findFirst({
        where: eq(quotes.id, id),
        with: {
            montage: {
                with: {
                    serviceItems: {
                        with: {
                            service: true
                        }
                    }
                }
            },
        },
    });
}

export async function createQuote(montageId: string) {
    const session = await getCurrentSession();
    if (!session || (session.user.roles.includes('installer') && !session.user.roles.includes('admin'))) {
        throw new Error('Unauthorized');
    }

    const id = randomUUID();

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: {
            displayId: true,
            status: true,
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

    // Automation: Move to 'quote_in_progress' if currently 'measurement_done'
    if (montage.status === 'measurement_done') {
        await db.update(montages)
            .set({ status: 'quote_in_progress' })
            .where(eq(montages.id, montageId));
    }

    revalidatePath('/dashboard/crm/oferty');
    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return id;
}

export async function updateQuote(id: string, data: {
    status?: QuoteStatus;
    items?: QuoteItem[];
    validUntil?: Date;
    notes?: string;
    termsContent?: string;
}) {
    const session = await getCurrentSession();
    if (!session || (session.user.roles.includes('installer') && !session.user.roles.includes('admin'))) {
        throw new Error('Unauthorized');
    }

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

    revalidatePath('/dashboard/crm/oferty');
    revalidatePath(`/dashboard/crm/oferty/${id}`);
}

export async function deleteQuote(id: string) {
    const session = await getCurrentSession();
    if (!session || (session.user.roles.includes('installer') && !session.user.roles.includes('admin'))) {
        throw new Error('Unauthorized');
    }

    await db.update(quotes)
        .set({ deletedAt: new Date() })
        .where(eq(quotes.id, id));
    revalidatePath('/dashboard/crm/oferty');
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
    const rawProducts = await db.query.erpProducts.findMany({
        where: (table, { eq }) => eq(table.status, 'active'),
        columns: {
            id: true,
            name: true,
            price: true,
        },
        with: {
            attributes: {
                with: {
                    attribute: true,
                    option: true,
                }
            }
        }
    });

    return rawProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        attributes: p.attributes.map(attr => ({
            id: attr.attribute.id,
            name: attr.attribute.name,
            slug: null, // ERP attributes don't have slugs yet
            options: attr.option ? [attr.option.value] : (attr.value ? [attr.value] : [])
        }))
    }));
}

type Product = {
    id: string;
    name: string;
    price: string | null;
    attributes: {
        id: string;
        name: string;
        slug: string | null;
        options: string[];
    }[];
};

type ProductAttribute = {
    id: string;
    name: string;
    slug: string | null;
    options: string[];
};

export async function getSmartImportItems(montageId: string, selectedProduct?: Partial<Product>) {
    const session = await getCurrentSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        with: {
            serviceItems: {
                with: {
                    service: true
                }
            }
        }
    });

    if (!montage) return { success: false, error: 'Montaż nie istnieje' };

    const items: QuoteItem[] = [];

    // 1. Base Service (Floor)
    if (montage.floorArea && montage.floorArea > 0) {
        const method = montage.measurementInstallationMethod || 'click';
        const pattern = montage.measurementFloorPattern || 'classic';
        
        let serviceId = '';
        if (pattern === 'herringbone') {
            serviceId = method === 'glue' ? 'svc_montaz_jodelka_klej' : 'svc_montaz_jodelka_klik';
        } else {
            serviceId = method === 'glue' ? 'svc_montaz_deska_klej' : 'svc_montaz_deska_klik';
        }

        const service = await db.query.services.findFirst({
            where: eq(services.id, serviceId)
        });

        if (service) {
            const priceNet = service.basePriceNet || 0;
            const vatRate = montage.isHousingVat ? 0.08 : 0.23;
            const quantity = montage.floorArea;
            
            items.push({
                id: randomUUID(),
                name: service.name,
                quantity: quantity,
                unit: 'm2',
                priceNet: priceNet,
                vatRate: vatRate,
                priceGross: priceNet * (1 + vatRate),
                totalNet: quantity * priceNet,
                totalGross: quantity * priceNet * (1 + vatRate),
            });
        }
    }

    // 2. Additional Services
    if (montage.serviceItems) {
        for (const item of montage.serviceItems) {
            const priceNet = item.clientPrice;
            const vatRate = item.vatRate || (montage.isHousingVat ? 0.08 : 0.23);
            const quantity = item.quantity;

            items.push({
                id: randomUUID(),
                name: item.snapshotName || item.service.name,
                quantity: quantity,
                unit: item.service.unit || 'szt',
                priceNet: priceNet,
                vatRate: vatRate,
                priceGross: priceNet * (1 + vatRate),
                totalNet: quantity * priceNet,
                totalGross: quantity * priceNet * (1 + vatRate),
            });
        }
    }

    // 3. Main Product (Panels)
    if (selectedProduct && montage.floorArea) {
        const attributes = selectedProduct.attributes as ProductAttribute[];
        let quantity = montage.floorArea;
        const unit = 'm2';
        let notes = '';
        const wastePercent = montage.panelWaste ?? 5;
        const quantityWithWaste = quantity * (1 + wastePercent / 100);
        const packageAttr = attributes?.find((a) => a.slug === 'pa_ilosc_opakowanie');
        
        if (packageAttr && packageAttr.options && packageAttr.options.length > 0) {
            const packageSize = parseFloat(packageAttr.options[0].replace(',', '.'));
            if (!isNaN(packageSize) && packageSize > 0) {
                const packagesNeeded = Math.ceil(quantityWithWaste / packageSize);
                quantity = packagesNeeded * packageSize;
                notes = `(Pełne opakowania: ${packagesNeeded} op. po ${packageSize} m2 [zapas ${wastePercent}%])`;
            } else {
                quantity = quantityWithWaste;
            }
        } else {
            quantity = quantityWithWaste;
        }

        const priceNet = parseFloat(selectedProduct.price || '0');
        
        items.push({
            id: randomUUID(),
            productId: selectedProduct.id,
            name: selectedProduct.name + (notes ? ` ${notes}` : ''),
            quantity: Number(quantity.toFixed(2)),
            unit: unit,
            priceNet: priceNet,
            vatRate: montage.isHousingVat ? 0.08 : 0.23,
            priceGross: priceNet * (montage.isHousingVat ? 1.08 : 1.23),
            totalNet: quantity * priceNet,
            totalGross: quantity * priceNet * (montage.isHousingVat ? 1.08 : 1.23),
        });
    }

    // 4. Additional Materials
    if (montage.measurementAdditionalMaterials) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const materials = montage.measurementAdditionalMaterials as any[];
        for (const material of materials) {
            const quantity = parseFloat(material.quantity) || 0;
            const priceNet = material.estimatedCost || 0;
            const vatRate = montage.isHousingVat ? 0.08 : 0.23;

            items.push({
                id: randomUUID(),
                name: material.name,
                quantity: quantity,
                unit: material.unit || 'szt',
                priceNet: priceNet,
                vatRate: vatRate,
                priceGross: priceNet * (1 + vatRate),
                totalNet: quantity * priceNet,
                totalGross: quantity * priceNet * (1 + vatRate),
            });
        }
    }

    return { success: true, items };
}
