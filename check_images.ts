
import { db } from './src/lib/db';
import { erpProducts } from './src/lib/db/schema';
import { isNotNull, like } from 'drizzle-orm';

async function checkImages() {
    console.log("Fetching sample products with images...");
    const products = await db.query.erpProducts.findMany({
        where: isNotNull(erpProducts.imageUrl),
        limit: 5,
        columns: {
            id: true,
            name: true,
            imageUrl: true
        }
    });

    console.log("Sample products:");
    console.table(products);

    // Check count of potential WP images
    const wpCount = await db.select({
        count: erpProducts.id
    }).from(erpProducts)
    .where(like(erpProducts.imageUrl, '%wp-content%'));
    
    console.log("Products with 'wp-content' in URL count:", wpCount.length); // Drizzle count mock, actually it returns array of rows if not aggregated properly, let's just see.
    // Drizzle count is tricky without sql function, but I just want to see if any exist.
    
    process.exit(0);
}

checkImages().catch(console.error);
