
import 'dotenv/config';
import { db } from './src/lib/db';
import { erpProducts } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkProduct() {
    const sku = 'PN-D-BAL-5CL';
    console.log(`Checking product with SKU: ${sku}`);

    const product = await db.query.erpProducts.findFirst({
        where: eq(erpProducts.sku, sku),
        with: {
            attributes: {
                with: {
                    attribute: true,
                    option: true
                }
            }
        }
    });

    if (!product) {
        console.log('Product not found!');
        return;
    }

    console.log('Product details:');
    console.log(`ID: ${product.id}`);
    console.log(`Name: ${product.name}`);
    console.log(`packageSizeM2 (column):`, product.packageSizeM2);

    console.log('\nAttributes:');
    if (product.attributes && product.attributes.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        product.attributes.forEach((attr: any) => {
             const attrName = attr.attribute?.name || 'Unknown Attr';
             const attrValue = attr.value || attr.option?.value;
            console.log(`- ${attrName}: ${attrValue}`);
        });
    } else {
        console.log('No attributes found.');
    }
}

checkProduct().catch(console.error).finally(() => process.exit());
