
import dotenv from 'dotenv';
import path from 'path';

// 1. Force load Environment Variables FIRST
const envPath = path.resolve(process.cwd(), '.env');
console.log(`[Script] Loading .env from: ${envPath}`);
const envLoad = dotenv.config({ path: envPath });

if (envLoad.error) {
    console.log("[Script] Local .env not found. Trying /srv/panel/.env for VPS...");
    dotenv.config({ path: '/srv/panel/.env' });
}

// 2. Main Logic wrapped in function to allow async imports (Environment Barrier)
async function main() {
    // Dynamic imports ensure modules are loaded AFTER .env is populated
    const { db } = await import('../src/lib/db');
    const { erpProducts } = await import('../src/lib/db/schema');
    const { like, eq } = await import('drizzle-orm');
    const { processAndUploadBuffer } = await import('../src/lib/r2/upload');

    console.log("------------------------------------------------");
    console.log("🚀 STARTING MIGRATION: WordPress -> Cloudflare R2");
    console.log("------------------------------------------------");

    // 3. Find target products
    const products = await db.query.erpProducts.findMany({
        where: like(erpProducts.imageUrl, '%wp-content%'),
        columns: {
            id: true,
            name: true,
            imageUrl: true
        }
    });

    const total = products.length;
    console.log(`📦 Found ${total} products with legacy WP images.`);

    if (total === 0) {
        console.log("✅ No legacy images found. System contains only R2/Clean images.");
        process.exit(0);
    }

    let success = 0;
    let failed = 0;

    // 4. Migrate Loop
    for (const [i, product] of products.entries()) {
        const current = i + 1;
        const progress = `[${current}/${total}]`;
        
        if (!product.imageUrl) continue;

        console.log(`\n${progress} Migrating: ${product.name}`);
        console.log(`       Source: ${product.imageUrl}`);

        try {
            // A. Fetch Image
            const response = await fetch(product.imageUrl);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`       ⚠️  Image 404 (Not Found) on WP. Keeping legacy link.`);
                } else {
                    console.error(`       ❌ Download failed: ${response.status} ${response.statusText}`);
                }
                failed++;
                continue;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // B. Optimize & Upload to R2 (Folder: products/{uuid})
            const newUrl = await processAndUploadBuffer({
                buffer: buffer,
                folderPath: `products/${product.id}`,
                existingUrl: null // IMPORTANT: Do not delete the external WP image
            });

            // C. Update Database
            await db.update(erpProducts)
                .set({ 
                    imageUrl: newUrl,
                    updatedAt: new Date()
                })
                .where(eq(erpProducts.id, product.id));
            
            console.log(`       ✅ Success: ${newUrl}`);
            success++;

        } catch (error) {
            console.error(`       ❌ Migration Error: ${error instanceof Error ? error.message : String(error)}`);
            failed++;
        }
    }

    console.log("\n================================================");
    console.log(`🏁 MIGRATION COMPLETED`);
    console.log(`   Success: ${success}`);
    console.log(`   Failed/Skipped: ${failed}`);
    console.log("================================================");
    process.exit(0);
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
