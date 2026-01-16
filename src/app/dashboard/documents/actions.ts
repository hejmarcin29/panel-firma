'use server';

import { db } from '@/lib/db';
import { documents, montageAttachments, quotes } from '@/lib/db/schema';
import { desc, eq, not, and, inArray } from 'drizzle-orm';

export type UnifiedDocument = {
    id: string;
    displayId: string;
    type: 'finance' | 'legal' | 'technical'; // finance = documents, legal = contracts/protocols/quotes, technical = sketches/plans
    fileType: 'pdf' | 'link' | 'image' | 'other';
    url: string;
    createdAt: Date;
    context: {
        id: string;
        type: 'montage' | 'order';
        label: string; // "Montaż: Jan Kowalski" or "Zamówienie #123"
        clientName: string;
    };
    sourceTable: 'documents' | 'attachments' | 'quotes';
};

export async function getCompanyDocuments(): Promise<UnifiedDocument[]> {
    const unifiedDocs: UnifiedDocument[] = [];

    // 1. Fetch Finance Documents (Invoices, Proformas) from 'documents' table
    const financeDocs = await db.query.documents.findMany({
        with: {
            montage: true,
            order: {
                with: {
                    customer: true
                }
            }
        },
        orderBy: [desc(documents.createdAt)]
    });

    for (const doc of financeDocs) {
        let contextType: 'montage' | 'order' = 'order';
        let contextId = doc.orderId || '';
        let label = 'Nieznane powiązanie';
        let clientName = 'Nieznany klient';

        if (doc.montage) {
            contextType = 'montage';
            contextId = doc.montage.id;
            label = `Montaż: ${doc.montage.clientName}`;
            clientName = doc.montage.clientName;
        } else if (doc.order) {
            contextType = 'order';
            contextId = doc.order.id;
            label = `Zamówienie: ${doc.order.displayNumber || doc.order.id.slice(0, 8)}`;
            if (doc.order.billingAddress && typeof doc.order.billingAddress === 'object' && 'name' in doc.order.billingAddress) {
                 clientName = (doc.order.billingAddress as { name?: string }).name || 'Klient Sklepu';
            } else if (doc.order.customer) {
                clientName = doc.order.customer.name;
            }
        }

        unifiedDocs.push({
            id: doc.id,
            displayId: doc.number || `DOK/${doc.id.slice(0,4)}`,
            type: 'finance',
            fileType: 'pdf', // Assuming documents are PDFs
            url: doc.pdfUrl || '#',
            createdAt: doc.createdAt,
            context: {
                id: contextId,
                type: contextType,
                label,
                clientName
            },
            sourceTable: 'documents'
        });
    }

    // 2. Fetch Operational Documents (Protocols, Contracts, Sketches) from 'montageAttachments'
    // Filter out loose photos (type = 'general' or 'photo' mostly) unless we decide otherwise.
    // User agreed to: "Pomiń rekordy z montageAttachments, gdzie type == 'photo' LUB type == 'general'"
    // But verify what types are actually used.
    // Common types: 'protocol', 'contract', 'scan', 'general' (often photos), 'sketch'.
    
    const attachments = await db.query.montageAttachments.findMany({
        where: and(
            not(inArray(montageAttachments.type, ['general', 'photo'])), // Exclude basic photos
        ),
        with: {
            montage: true
        },
        orderBy: [desc(montageAttachments.createdAt)]
    });

    for (const att of attachments) {
        // Double check title just in case type is 'general' but title says 'Umowa' (historical data)
        // const isImportant = att.type !== 'general' || (att.title && (att.title.toLowerCase().includes('umowa') || att.title.toLowerCase().includes('protokół')));
        
        // Since we filtered in query, we mostly trust 'type', but let's be safe if query filter needs adjustment.
        // Actually the query filter above `not(inArray(..., ['general', 'photo']))` already does the heavy lifting.
        // Let's refine types mapping.
        
        let docType: 'finance' | 'legal' | 'technical' = 'technical';
        if (att.type === 'protocol' || att.title?.toLowerCase().includes('protokół') || att.title?.toLowerCase().includes('umowa')) {
            docType = 'legal';
        }

        let fileType: 'pdf' | 'image' | 'link' | 'other' = 'other';
        if (att.url.endsWith('.pdf')) fileType = 'pdf';
        else if (att.url.match(/\.(jpg|jpeg|png|webp)$/i)) fileType = 'image';

        unifiedDocs.push({
            id: att.id,
            displayId: att.title || 'Bez nazuwy',
            type: docType,
            fileType: fileType,
            url: att.url,
            createdAt: att.createdAt,
            context: {
                id: att.montageId,
                type: 'montage',
                label: `Montaż: ${att.montage.clientName}`,
                clientName: att.montage.clientName
            },
            sourceTable: 'attachments'
        });
    }

    // 3. Fetch Signed Quotes (Virtual Function)
    // Only accepted quotes that count as "Contracts" if no PDF exists yet
    const acceptedQuotes = await db.query.quotes.findMany({
        where: eq(quotes.status, 'accepted'),
        with: {
            montage: true
        },
        orderBy: [desc(quotes.updatedAt)]
    });

    for (const q of acceptedQuotes) {
        unifiedDocs.push({
            id: q.id,
            displayId: q.number || `OFERTA/${q.id.slice(0,4)}`,
            type: 'legal',
            fileType: 'link', // It's a link to the quote view
            url: `/dashboard/crm/oferty/${q.id}`,
            createdAt: q.signedAt || q.updatedAt,
            context: {
                id: q.montageId,
                type: 'montage',
                label: `Montaż: ${q.montage.clientName}`,
                clientName: q.montage.clientName
            },
            sourceTable: 'quotes'
        });
    }

    // Sort everything by date desc
    return unifiedDocs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
