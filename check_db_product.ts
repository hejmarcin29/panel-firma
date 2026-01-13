
import 'dotenv/config';
import { db } from './src/lib/db';
import { erpProducts } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
    console.log("Checking DB connection...");
    // console.log("URL:", process.env.DATABASE_URL); // Don't print secrets in logs if possible, or mask them
    
    try {
        const product = await db.query.erpProducts.findFirst({
            where: eq(erpProducts.isShopVisible, true)
        });
        
        if (product) {
            console.log("Found visible product:", product.name);
            console.log("Slug:", product.slug);
        } else {
            console.log("No products are set to 'isShopVisible: true'");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error querying DB:", e);
        process.exit(1);
    }
}

check();
