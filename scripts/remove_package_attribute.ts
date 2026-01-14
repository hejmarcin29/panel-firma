
import 'dotenv/config';
import { db } from '../src/lib/db';
import { erpProductAttributes, erpAttributes, erpAttributeOptions } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function removeAttribute() {
    console.log("Starting cleanup: Removing attribute 'Ilość w opakowaniu (m²)' from all products and deleting definition.");

    // 1. Find the Attribute ID
    const attrName = "Ilość w opakowaniu (m²)";
    const attribute = await db.query.erpAttributes.findFirst({
        where: eq(erpAttributes.name, attrName)
    });

    if (!attribute) {
        console.error(`Attribute "${attrName}" not found in database.`);
        return;
    }
    console.log(`Found attribute ID: ${attribute.id}`);

    // 2. Delete all product-attribute associations
    const deletedAssociations = await db.delete(erpProductAttributes)
        .where(eq(erpProductAttributes.attributeId, attribute.id))
        .returning();

    console.log(`Deleted ${deletedAssociations.length} product associations (values).`);

    // 3. Delete any predefined options for this attribute (if any)
    const deletedOptions = await db.delete(erpAttributeOptions)
        .where(eq(erpAttributeOptions.attributeId, attribute.id))
        .returning();

    console.log(`Deleted ${deletedOptions.length} predefined options.`);

    // 4. Delete the attribute definition itself
    // NOTE: This might fail if there are still foreign keys somewhere, 
    // but schema says only erpProductAttributes and erpAttributeOptions reference it.
    await db.delete(erpAttributes)
        .where(eq(erpAttributes.id, attribute.id));

    console.log(`Attribute definition deleted.`);
    console.log(`Cleanup complete.`);
}

removeAttribute().catch(console.error).finally(() => process.exit());
