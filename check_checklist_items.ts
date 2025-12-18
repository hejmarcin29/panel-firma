
import 'dotenv/config';
import { db } from './src/lib/db';
import { montages, montageChecklistItems } from './src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function check() {
    const allMontages = await db.select({
        id: montages.id,
        displayId: montages.displayId,
        createdAt: montages.createdAt
    }).from(montages);

    console.log(`Total montages: ${allMontages.length}`);

    let montagesWithoutChecklist = 0;

    for (const m of allMontages) {
        const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(montageChecklistItems)
            .where(eq(montageChecklistItems.montageId, m.id))
            .then(res => res[0]?.count ?? 0);

        if (count === 0) {
            console.log(`Montage ${m.displayId} (${m.id}) has NO checklist items. Created at: ${m.createdAt}`);
            montagesWithoutChecklist++;
        }
    }

    console.log(`Montages without checklist: ${montagesWithoutChecklist} / ${allMontages.length}`);
}

check().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
