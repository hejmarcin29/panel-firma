
import * as dotenv from 'dotenv';
dotenv.config();

import { eq, isNotNull } from 'drizzle-orm';

async function main() {
    const { db } = await import('./src/lib/db');
    const { 
        erpProducts, 
        erpMountingMethods, 
        erpFloorPatterns, 
        erpWearClasses, 
        erpStructures 
    } = await import('./src/lib/db/schema');

    console.log("Migrating values from text columns to Dictionary Tables...");

    // 1. Fetch all products
    const products = await db.select().from(erpProducts);
    
    // 2. Identify unique values
    const mountings = new Set(products.map(p => p.mountingMethod).filter(Boolean));
    const patterns = new Set(products.map(p => p.floorPattern).filter(Boolean));
    const classes = new Set(products.map(p => p.wearClass).filter(Boolean));
    const structures = new Set(products.map(p => p.structure).filter(Boolean));

    console.log("Found Mounting Methods:", mountings);
    console.log("Found Patterns:", patterns);
    console.log("Found Classes:", classes);
    console.log("Found Structures:", structures);

    // Helpers
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 3. Insert into Dictionaries and Get ID Map
    const mapMounting = new Map<string, string>();
    const mapPattern = new Map<string, string>();
    const mapClass = new Map<string, string>();
    const mapStructure = new Map<string, string>();

    // Function to ensure dictionary entry
    async function ensureEntry(table: any, value: string, map: Map<string, string>) {
        // Check if exists
        // Note: checking by slug or name is safer. I'll check by slug.
        const slug = slugify(value);
        let record = await db.select().from(table).where(eq(table.slug, slug)).limit(1);
        
        let id = '';
        if (record.length > 0) {
            id = record[0].id;
        } else {
            // Create
            const ret = await db.insert(table).values({
                name: value, // Use the raw value as Name (e.g. "Herringbone")
                slug: slug
            }).returning({ id: table.id });
            id = ret[0].id;
        }
        map.set(value, id);
    }

    for (const m of mountings) await ensureEntry(erpMountingMethods, m!, mapMounting);
    for (const p of patterns) await ensureEntry(erpFloorPatterns, p!, mapPattern);
    for (const c of classes) await ensureEntry(erpWearClasses, c!, mapClass);
    for (const s of structures) await ensureEntry(erpStructures, s!, mapStructure);

    // 4. Update products
    let updated = 0;
    for (const prod of products) {
        const updates: any = {};
        
        if (prod.mountingMethod && mapMounting.has(prod.mountingMethod)) {
            updates.mountingMethodId = mapMounting.get(prod.mountingMethod);
        }
        if (prod.floorPattern && mapPattern.has(prod.floorPattern)) {
            updates.floorPatternId = mapPattern.get(prod.floorPattern);
        }
        if (prod.wearClass && mapClass.has(prod.wearClass)) {
            updates.wearClassId = mapClass.get(prod.wearClass);
        }
        if (prod.structure && mapStructure.has(prod.structure)) {
            updates.structureId = mapStructure.get(prod.structure);
        }

        if (Object.keys(updates).length > 0) {
            await db.update(erpProducts).set(updates).where(eq(erpProducts.id, prod.id));
            updated++;
        }
    }

    console.log(`Updated ${updated} products with Dictionary FKs.`);
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
