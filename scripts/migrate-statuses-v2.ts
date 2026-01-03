import { db } from '../src/lib/db';
import { montages } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    console.log('Starting migration of statuses...');

    const mappings = {
        'lead': 'new_lead',
        'before_measurement': 'measurement_scheduled',
        'before_first_payment': 'waiting_for_deposit',
        'before_installation': 'installation_scheduled',
        'before_final_invoice': 'installation_in_progress',
        'completed': 'completed',
        'cancelled': 'rejected'
    };

    for (const [oldStatus, newStatus] of Object.entries(mappings)) {
        console.log(`Migrating ${oldStatus} -> ${newStatus}...`);
        await db.update(montages)
            .set({ status: newStatus })
            .where(sql`status = ${oldStatus}`);
    }

    console.log('Migration completed.');
    process.exit(0);
}

migrate();
