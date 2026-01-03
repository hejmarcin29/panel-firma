
import 'dotenv/config';
import { db } from './src/lib/db';
import { montages, montageChecklistItems, appSettings } from './src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

type MontageChecklistTemplate = {
	id: string;
	label: string;
	allowAttachment: boolean;
    associatedStage?: string;
};

const DEFAULT_MONTAGE_CHECKLIST: readonly MontageChecklistTemplate[] = [
	{
		id: 'contract_signed_check',
		label: 'Podpisano umowę/cenę',
		allowAttachment: false,
        associatedStage: 'before_first_payment',
	},
	{
		id: 'advance_invoice_issued',
		label: 'Wystawiono FV zaliczkową',
		allowAttachment: false,
        associatedStage: 'before_first_payment',
	},
	{
		id: 'advance_invoice_paid',
		label: 'Zapłacono FV zaliczkową',
		allowAttachment: false,
        associatedStage: 'before_first_payment',
	},
	{
		id: 'protocol_signed',
		label: 'Podpisano protokół odbioru',
		allowAttachment: true,
        associatedStage: 'before_final_invoice',
	},
	{
		id: 'final_invoice_issued',
		label: 'Wystawiono FV końcową',
		allowAttachment: false,
        associatedStage: 'before_final_invoice',
	},
	{
		id: 'final_invoice_paid',
		label: 'Zapłacono FV końcową',
		allowAttachment: false,
        associatedStage: 'before_final_invoice',
	},
	{
		id: 'protocol_signed_skirting',
		label: 'Podpisano protokół odbioru (Listwy)',
		allowAttachment: true,
        associatedStage: 'before_final_invoice',
	},
];

async function getTemplates(): Promise<MontageChecklistTemplate[]> {
    try {
        const rows = await db
            .select({ value: appSettings.value })
            .from(appSettings)
            .where(eq(appSettings.key, 'montage.checklist'));
        
        const rawValue = rows[0]?.value;
        
        if (rawValue) {
            const parsed = JSON.parse(rawValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed as MontageChecklistTemplate[];
            }
        }
    } catch (e) {
        console.warn('Error fetching/parsing checklist settings, using default.', e);
    }
    
    return [...DEFAULT_MONTAGE_CHECKLIST];
}

async function fix() {
    console.log('Starting fix script...');
    
    const allMontages = await db.select({
        id: montages.id,
        displayId: montages.displayId,
        createdAt: montages.createdAt
    }).from(montages);

    console.log(`Total montages: ${allMontages.length}`);

    let fixedCount = 0;
    const templates = await getTemplates();
    
    if (templates.length === 0) {
        console.log('No checklist templates defined. Cannot fix.');
        return;
    }

    console.log(`Found ${templates.length} templates.`);

    for (const m of allMontages) {
        const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(montageChecklistItems)
            .where(eq(montageChecklistItems.montageId, m.id))
            .then(res => res[0]?.count ?? 0);

        if (count === 0) {
            console.log(`Fixing montage ${m.displayId} (${m.id})...`);
            
            await db.insert(montageChecklistItems).values(
                templates.map((template, index) => ({
                    id: crypto.randomUUID(),
                    montageId: m.id,
                    templateId: template.id,
                    label: template.label,
                    assignedRole: template.assignedRole,
                    allowAttachment: template.allowAttachment,
                    completed: false,
                    orderIndex: index,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }))
            );
            
            fixedCount++;
        }
    }

    console.log(`Fixed montages: ${fixedCount}`);
}

fix().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
