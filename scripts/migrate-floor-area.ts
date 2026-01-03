
import { db } from '../src/lib/db';
import { montages } from '../src/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import * as dotenv from 'dotenv';

/* eslint-disable @typescript-eslint/no-explicit-any */

dotenv.config();

async function migrate() {
    console.log('Starting migration of floor area...');

    try {
        // Move floorArea to estimatedFloorArea for leads and before_measurement
        // where estimatedFloorArea is null (to avoid double migration)
        await db.update(montages)
            .set({
                estimatedFloorArea: montages.floorArea,
                floorArea: null
            })
            .where(
                or(
                    eq(montages.status, 'lead' as any),
                    eq(montages.status, 'before_measurement' as any)
                )
            );

        console.log('Migration completed successfully.');
        
    } catch (error) {
        console.error('Migration failed:', error);
    }
    process.exit(0);
}

migrate();
