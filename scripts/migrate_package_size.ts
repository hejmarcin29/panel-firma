
import 'dotenv/config';
import { db } from '../src/lib/db';
import { erpProducts, erpProductAttributes, erpAttributes, erpAttributeOptions } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function migrate() {
    console.log("Starting migration: Attribute 'Ilość w opakowaniu (m²)' -> Column 'package_size_m2'");

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

    // 2. Find all product values for this attribute
    // We need to handle both direct values and option-based values
    const productAttributes = await db.select({
        productId: erpProductAttributes.productId,
        value: erpProductAttributes.value,
        optionValue: erpAttributeOptions.value
    })
    .from(erpProductAttributes)
    .leftJoin(erpAttributeOptions, eq(erpProductAttributes.optionId, erpAttributeOptions.id))
    .where(eq(erpProductAttributes.attributeId, attribute.id));

    console.log(`Found ${productAttributes.length} products with this attribute set.`);

    let updatedCount = 0;

    // 3. Iterate and Update Products
    for (const pa of productAttributes) {
        const rawValue = pa.value || pa.optionValue;
        
        if (!rawValue) {
            console.warn(`Product ${pa.productId} has empty attribute value. Skipping.`);
            continue;
        }

        // Clean and parse the string to float
        // Replace comma with dot, remove non-numeric chars except dot
        const normalizedValue = rawValue.replace(',', '.').replace(/[^\d.]/g, '');
        const floatValue = parseFloat(normalizedValue);

        if (isNaN(floatValue)) {
            console.warn(`Skipping invalid/non-numeric value for product ${pa.productId}: "${rawValue}"`);
            continue;
        }

        // Update the product record
        await db.update(erpProducts)
            .set({ 
                packageSizeM2: floatValue,
                updatedAt: new Date() // Good practice to touch metadata
            })
            .where(eq(erpProducts.id, pa.productId));

        updatedCount++;
        // console.log(`Updated Product ${pa.productId}: ${floatValue} m² (from "${rawValue}")`);
    }

    console.log(`Migration complete.`);
    console.log(`Successfully updated ${updatedCount} products.`);
}

migrate().catch(console.error).finally(() => process.exit());
