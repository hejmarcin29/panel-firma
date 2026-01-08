import { db } from '@/lib/db';
import { 
    customers, 
    montages, 
    montageNotes,
    montageChecklistItems,
    type CustomerSource, 
    type MontageSampleStatus 
} from '@/lib/db/schema';
import { getMontageChecklistTemplates } from '@/lib/montaze/checklist';

export type CreateLeadData = {
    clientName: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    description?: string;
    forecastedInstallationDate?: string;
    sampleStatus?: MontageSampleStatus;
    existingCustomerId?: string;
    source?: CustomerSource;
    architectId?: string;
    partnerId?: string;
    
    // Automation context
    sendNotification?: boolean;
};

export type LeadCreationResult = {
    success: boolean;
    message: string;
    montageId?: string;
    customerId?: string;
    status?: 'success' | 'duplicate_found' | 'error';
    existingCustomer?: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    };
};

export async function generateNextMontageId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `M/${year}/`;

    const lastMontage = await db.query.montages.findFirst({
        where: (table, { like }) => like(table.displayId, `${prefix}%`),
        orderBy: (table, { desc }) => [desc(table.displayId)],
    });

    let nextNumber = 1;
    if (lastMontage && lastMontage.displayId) {
        const parts = lastMontage.displayId.split('/');
        if (parts.length === 3) {
            const lastNumber = parseInt(parts[2], 10);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

export async function createLeadCore(data: CreateLeadData): Promise<LeadCreationResult> {
    try {
        const trimmedName = data.clientName.trim();
        if (!trimmedName) {
            return { success: false, message: 'Podaj nazwę klienta.', status: 'error' };
        }

        const displayId = await generateNextMontageId();
        const montageId = crypto.randomUUID();
        const now = new Date();

        const normalizedEmail = data.contactEmail?.trim() || null;
        const normalizedPhone = data.contactPhone?.trim() || null;
        let customerId = data.existingCustomerId;

        // If no existing customer ID provided, check for duplicates (and reuse if found)
        if (!customerId) {
            // Priority 1: Check by Email
            if (normalizedEmail) {
                const existingCustomer = await db.query.customers.findFirst({
                    where: (table, { eq }) => eq(table.email, normalizedEmail),
                });

                if (existingCustomer) {
                    customerId = existingCustomer.id;
                }
            }

            // Priority 2: Check by Phone (only if not found by email)
            if (!customerId && normalizedPhone) {
                // Remove formatting for search if needed, but assuming DB has raw format or we search strictly
                // For better matching, ideally we should store normalized phones. 
                // For now, we search exact match.
                const existingCustomer = await db.query.customers.findFirst({
                    where: (table, { eq }) => eq(table.phone, normalizedPhone),
                });

                if (existingCustomer) {
                    customerId = existingCustomer.id;
                }
            }

            // Create new customer record ONLY if not found
            if (!customerId) {
                customerId = crypto.randomUUID();
                await db.insert(customers).values({
                    id: customerId,
                    name: trimmedName,
                    phone: normalizedPhone,
                    email: normalizedEmail,
                    source: data.source || 'other',
                    architectId: data.architectId || null,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            // If found, we just proceed using the found customerId
        }

        await db.insert(montages).values({
            id: montageId,
            displayId,
            customerId: customerId!, 
            clientName: trimmedName,
            status: 'new_lead',
            contactPhone: normalizedPhone,
            contactEmail: normalizedEmail,
            installationCity: data.address?.trim() || null,
            billingCity: data.address?.trim() || null,
            clientInfo: data.description?.trim() || null,
            forecastedInstallationDate: data.forecastedInstallationDate ? new Date(data.forecastedInstallationDate) : null,
            sampleStatus: data.sampleStatus || 'none',
            architectId: data.architectId || null,
            partnerId: data.partnerId || null, 
            createdAt: now,
            updatedAt: now,
        });

        if (data.description?.trim()) {
            await db.insert(montageNotes).values({
                id: crypto.randomUUID(),
                montageId: montageId,
                content: `[Info od klienta / Źródło: ${data.source || 'other'}]: ${data.description.trim()}`,
                isInternal: false,
                createdBy: null, // System / User unknown
                createdAt: now,
            });
        }

        // Initialize checklist items
        const templates = await getMontageChecklistTemplates();
        const checklistItems = templates.map((template, index) => {
            let isCompleted = false;
            
            // Smart Checklist Logic for Sample Verification
            if (template.id === 'sample_verification') {
                const status = data.sampleStatus || 'none';
                if (status === 'none' || status === 'delivered') {
                    isCompleted = true;
                }
            }

            return {
                id: crypto.randomUUID(),
                montageId: montageId,
                templateId: template.id,
                label: template.label,
                allowAttachment: template.allowAttachment,
                orderIndex: index,
                completed: isCompleted,
                createdAt: now,
                updatedAt: now,
            };
        });

        if (checklistItems.length > 0) {
            await db.insert(montageChecklistItems).values(checklistItems);
        }

        // If configured, we would send notifications here
        // if (data.sendNotification) { ... }

        return { success: true, message: 'Dodano nowy lead.', montageId, customerId, status: 'success' };
    } catch (error) {
        console.error('Error creating lead:', error);
        return { success: false, message: 'Wystąpił błąd podczas tworzenia leada.', status: 'error' };
    }
}
