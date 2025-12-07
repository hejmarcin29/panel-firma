const { db } = require('./src/lib/db');
const { products } = require('./src/lib/db/schema');
const { like, eq, and } = require('drizzle-orm');

async function checkProducts() {
    console.log('Checking products with category 482...');
    
    // Fetch all products and check their categories manually to be sure
    const allProducts = await db.select().from(products);
    
    let matchCount = 0;
    let sample = null;

    for (const p of allProducts) {
        const cats = JSON.parse(p.categories || '[]');
        if (cats.includes(482)) {
            matchCount++;
            if (!sample) sample = p;
        }
    }

    console.log(`Found ${matchCount} products with category ID 482 in JSON.`);
    if (sample) {
        console.log('Sample product:', {
            id: sample.id,
            name: sample.name,
            categories: sample.categories,
            status: sample.status
        });
    }

    // Now test the LIKE query
    const likeResults = await db.select().from(products).where(like(products.categories, '%482%'));
    console.log(`Found ${likeResults.length} products using LIKE '%482%' query.`);

    // Check total products
    console.log(`Total products in DB: ${allProducts.length}`);
}

checkProducts().catch(console.error);
