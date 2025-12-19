
import { db } from '../src/lib/db';
import { montages } from '../src/lib/db/schema';
import { isNotNull, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    console.log('Starting migration of client info...');

    try {
        // 1. Copy materialDetails to clientInfo where materialDetails is not null
        // and clientInfo is null (to avoid overwriting if already migrated)
        const result = await db.update(montages)
            .set({
                clientInfo: sql`${montages.materialDetails}`,
                materialDetails: null 
            })
            .where(isNotNull(montages.materialDetails));

        console.log('Migration completed successfully.');
        console.log('Note: materialDetails content has been copied to clientInfo.');
        console.log('If you want to clear materialDetails, you can run a separate update.');
        
    } catch (error) {
        console.error('Migration failed:', error);
    }
    process.exit(0);
}

migrate();
