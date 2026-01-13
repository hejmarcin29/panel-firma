
import 'dotenv/config';
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        console.log("Attempting to connect to database...");
        
        // Check if the column exists in information_schema
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'montage_floor_products' 
            AND column_name = 'pattern';
        `);

        if (result.length > 0) {
            console.log("SUCCESS: Connection established.");
            console.log("VERIFICATION: Column 'pattern' exists in 'montage_floor_products'.");
            console.log("Column details:", result[0]);
        } else {
            console.log("SUCCESS: Connection established.");
            console.warn("WARNING: Column 'pattern' was NOT found in 'montage_floor_products'.");
        }
    } catch (error) {
        console.error("ERROR: Could not connect to database.");
        console.error(error);
    }
    process.exit(0);
}

check();
