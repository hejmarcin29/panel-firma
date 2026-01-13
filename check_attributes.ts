
import 'dotenv/config';
import { db } from './src/lib/db';
import { erpAttributes, erpAttributeOptions, erpProductAttributes } from './src/lib/db/schema';

async function checkAttributes() {
    console.log("Checking attributes...");
    
    // 1. Get all attribute definitions
    const attributes = await db.select().from(erpAttributes);
    console.log("\nFound Attributes:", attributes.length);
    attributes.forEach(attr => {
        console.log(`- [${attr.id}] ${attr.name} (Type: ${attr.type})`);
    });

    // 2. Check value of 'Kolekcja' or 'Marka' if they exist
    const brandAttr = attributes.find(a => a.name.toLowerCase().includes('marka') || a.name.toLowerCase().includes('brand') || a.name.toLowerCase().includes('producent'));
    const collectionAttr = attributes.find(a => a.name.toLowerCase().includes('kolekcja') || a.name.toLowerCase().includes('collection'));

    if (brandAttr) {
        console.log(`\nFound Brand Attribute: ${brandAttr.name} (${brandAttr.id})`);
    } else {
        console.log("\nWARNING: No 'Marka'/'Brand' attribute found.");
    }

    if (collectionAttr) {
        console.log(`\nFound Collection Attribute: ${collectionAttr.name} (${collectionAttr.id})`);
    } else {
        console.log("\nWARNING: No 'Kolekcja'/'Collection' attribute found.");
    }

    // 3. Dump some product attribute values to see structure
    const productAttrs = await db.query.erpProductAttributes.findMany({
        limit: 5,
        with: {
            attribute: true,
            option: true
        }
    });

    console.log("\nSample Product Attributes:");
    productAttrs.forEach(pa => {
        console.log(`- Product: ... | Attr: ${pa.attribute.name} | Value: ${pa.value || pa.option?.value}`);
    });
}

checkAttributes().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
