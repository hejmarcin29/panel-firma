
import * as dotenv from 'dotenv';
dotenv.config();

import { sql } from 'drizzle-orm';

async function main() {
    const { db } = await import('./src/lib/db');
    
    console.log("Applying manual migration...");

    try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "erp_floor_patterns" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "slug" text, CONSTRAINT "erp_floor_patterns_slug_unique" UNIQUE("slug"))`);
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "erp_mounting_methods" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "slug" text, CONSTRAINT "erp_mounting_methods_slug_unique" UNIQUE("slug"))`);
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "erp_structures" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "slug" text, CONSTRAINT "erp_structures_slug_unique" UNIQUE("slug"))`);
        await db.execute(sql`CREATE TABLE IF NOT EXISTS "erp_wear_classes" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "slug" text, CONSTRAINT "erp_wear_classes_slug_unique" UNIQUE("slug"))`);
        
        // Add columns if not exist
        await db.execute(sql`ALTER TABLE "erp_products" ADD COLUMN IF NOT EXISTS "mounting_method_id" text`);
        await db.execute(sql`ALTER TABLE "erp_products" ADD COLUMN IF NOT EXISTS "floor_pattern_id" text`);
        await db.execute(sql`ALTER TABLE "erp_products" ADD COLUMN IF NOT EXISTS "wear_class_id" text`);
        await db.execute(sql`ALTER TABLE "erp_products" ADD COLUMN IF NOT EXISTS "structure_id" text`);

        // Add constraints (only if they don't exist, hard to check easily in raw sql without erroring, so we wrap)
        // Or we assume they don't exist yet. The previous migrate command failed on "quotes" table which is unrelated to this change. 
        // It failed because my local migration history is out of sync.
        
        // Add FKs
        try { await db.execute(sql`ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_mounting_method_id_fk" FOREIGN KEY ("mounting_method_id") REFERENCES "erp_mounting_methods"("id")`); } catch {}
        try { await db.execute(sql`ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_floor_pattern_id_fk" FOREIGN KEY ("floor_pattern_id") REFERENCES "erp_floor_patterns"("id")`); } catch {}
        try { await db.execute(sql`ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_wear_class_id_fk" FOREIGN KEY ("wear_class_id") REFERENCES "erp_wear_classes"("id")`); } catch {}
        try { await db.execute(sql`ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_structure_id_fk" FOREIGN KEY ("structure_id") REFERENCES "erp_structures"("id")`); } catch {}

        console.log("Migration applied.");
    } catch (e) {
        console.error("Error applying migration", e);
    }

    process.exit(0);
}

main().catch(console.error);
