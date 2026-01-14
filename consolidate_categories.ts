
import 'dotenv/config';
import { db } from './src/lib/db';
import { erpCategories, erpProducts } from './src/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function main() {
    console.log("Starting Category Consolidation...");

    const oldCategoryNames = [
        "Panele - Click - Klasyczne",
        "Panele - Click - Jodełka",
        "Panele - Klejone - Klasyczne",
        "Panele - Klejone - Jodełka"
    ];

    // 1. Find old categories
    const allCats = await db.select().from(erpCategories);
    const oldCats = allCats.filter(c => oldCategoryNames.includes(c.name));
    
    if (oldCats.length === 0) {
        console.log("No old categories found to migrate.");
        return;
    }

    const oldIds = oldCats.map(c => c.id);
    console.log(`Found ${oldIds.length} old categories to migrate.`);

    // 2. Create or Find new "Podłogi" category
    let targetCat = allCats.find(c => c.name === "Podłogi");
    
    if (!targetCat) {
        console.log("Creating new category 'Podłogi'...");
        const [newCat] = await db.insert(erpCategories).values({
            name: "Podłogi",
            slug: "podlogi"
        }).returning();
        targetCat = newCat;
    } else {
        console.log("Using existing category 'Podłogi'.");
    }

    console.log(`Target Category ID: ${targetCat.id}`);

    // 3. Move products
    console.log("Moving products...");
    const result = await db.update(erpProducts)
        .set({ categoryId: targetCat.id })
        .where(inArray(erpProducts.categoryId, oldIds));
    
    console.log("Products moved.");

    // 4. Delete old categories
    console.log("Deleting old categories...");
    await db.delete(erpCategories)
        .where(inArray(erpCategories.id, oldIds));

    console.log("Done.");
}

main().catch(console.error);
