
import 'dotenv/config';
import { db } from '../src/lib/db';
import { erpProducts } from '../src/lib/db/schema';
import { eq, and } from 'drizzle-orm';

function generateSlug(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function main() {
    console.log("Fixing missing slugs for visible products...");
    
    // Find visible products without slug
    // Note: Drizzle might filter 'slug IS NULL' using isNull(erpProducts.slug)
    const products = await db.query.erpProducts.findMany({
        where: and(
            eq(erpProducts.isShopVisible, true),
        )
    });

    for (const p of products) {
        if (!p.slug) {
            const newSlug = generateSlug(p.name);
            console.log(`Updating "${p.name}" -> "${newSlug}"`);
            try {
                await db.update(erpProducts)
                    .set({ slug: newSlug })
                    .where(eq(erpProducts.id, p.id));
            } catch (e) {
                console.error(`Failed to update ${p.name}:`, e);
            }
        } else {
            console.log(`Skipping "${p.name}" (already has slug: ${p.slug})`);
        }
    }
    
    console.log("Done.");
}

main();
