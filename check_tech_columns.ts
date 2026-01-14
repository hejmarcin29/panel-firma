
import { db } from './src/lib/db';
import { erpProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function checkColumns() {
    console.log("Checking erp_products columns...");
    
    const results = await db.select({
        id: erpProducts.id,
        name: erpProducts.name,
        mountingMethod: erpProducts.mountingMethod,
        floorPattern: erpProducts.floorPattern
    })
    .from(erpProducts)
    .limit(10);

    console.log("Sample 10 products:");
    results.forEach(p => {
        console.log(`[${p.name}] Method: ${p.mountingMethod}, Pattern: ${p.floorPattern}`);
    });
    
    // Count stats
    const stats = await db.execute(sql`
        SELECT 
            COUNT(*) as total,
            COUNT(mounting_method) as filled_method,
            COUNT(floor_pattern) as filled_pattern
        FROM erp_products
    `);
    
    console.log("Stats:", stats[0]);
    process.exit(0);
}

checkColumns();
