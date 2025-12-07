const { syncProducts } = require('./src/lib/sync/products');

async function runSync() {
    console.log('Starting product sync...');
    try {
        await syncProducts();
        console.log('Sync completed successfully.');
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

runSync();
