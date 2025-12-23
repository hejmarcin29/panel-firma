import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appSettings, customers, montages, systemLogs, montageChecklistItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_MONTAGE_CHECKLIST } from '@/lib/montaze/checklist-shared';
import { isSystemAutomationEnabled } from '@/lib/montaze/automation';

export async function POST(req: NextRequest) {
    try {
        const isEnabled = await isSystemAutomationEnabled('webhook_fluent_lead');
        if (!isEnabled) {
            return NextResponse.json({ error: 'Automation disabled' }, { status: 200 });
        }

        // 1. Validate Secret
        const secretHeader = req.headers.get('x-api-secret');
        
        if (!secretHeader) {
            return NextResponse.json({ error: 'Missing secret header' }, { status: 401 });
        }

        const storedSetting = await db.query.appSettings.findFirst({
            where: eq(appSettings.key, 'fluent_forms_secret'),
        });

        if (!storedSetting || storedSetting.value !== secretHeader) {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();
        const { client_name, contact_email, contact_phone, message, city, postal_code } = body;

        if (!contact_email || !client_name) {
            return NextResponse.json({ error: 'Missing required fields: client_name, contact_email' }, { status: 400 });
        }

        // 3. Create or Update Customer
        let customerId: string;
        const existingCustomer = await db.query.customers.findFirst({
            where: eq(customers.email, contact_email),
        });

        if (existingCustomer) {
            customerId = existingCustomer.id;
            // Optional: Update phone if missing
            if (!existingCustomer.phone && contact_phone) {
                await db.update(customers)
                    .set({ phone: contact_phone, updatedAt: new Date() })
                    .where(eq(customers.id, customerId));
            }
        } else {
            customerId = crypto.randomUUID();
            await db.insert(customers).values({
                id: customerId,
                name: client_name,
                email: contact_email,
                phone: contact_phone,
                source: 'internet',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // 4. Create Montage (Lead)
        const montageId = crypto.randomUUID();
        await db.insert(montages).values({
            id: montageId,
            customerId: customerId,
            clientName: client_name,
            contactEmail: contact_email,
            contactPhone: contact_phone,
            installationCity: city,
            installationPostalCode: postal_code,
            additionalInfo: message, // The message from the form
            status: 'lead', // Important: This puts it in "Nowy Lead"
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Initialize checklist items
        const checklistItems = DEFAULT_MONTAGE_CHECKLIST.map((template, index) => ({
            id: crypto.randomUUID(),
            montageId: montageId,
            templateId: template.id,
            label: template.label,
            allowAttachment: template.allowAttachment,
            orderIndex: index,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        if (checklistItems.length > 0) {
            await db.insert(montageChecklistItems).values(checklistItems);
        }

        // 5. Log Success
        await db.insert(systemLogs).values({
            id: crypto.randomUUID(),
            action: 'fluent_forms_webhook',
            details: `Created lead ${montageId} for customer ${contact_email}`,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true, montageId });

    } catch (error) {
        console.error('Fluent Forms Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
