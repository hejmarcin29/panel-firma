const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Load env manually to avoid dependencies
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const db = new Database('sqlite.db');

async function sync() {
    console.log('🔄 Rozpoczynam synchronizację produktów z WooCommerce...');
    
    // Fetch credentials from DB
    const settings = db.prepare(`
        SELECT key, value FROM app_settings 
        WHERE key IN ('woocommerce.url', 'woocommerce.consumer_key', 'woocommerce.consumer_secret')
    `).all();

    const getSetting = (k) => settings.find(s => s.key === k)?.value;

    const url = getSetting('woocommerce.url');
    const key = getSetting('woocommerce.consumer_key');
    const secret = getSetting('woocommerce.consumer_secret');

    if (!url || !key || !secret) {
        console.error('❌ Brak danych dostępowych do WooCommerce w bazie danych (tabela app_settings)');
        console.log('Znalezione ustawienia:', settings);
        return;
    }

    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    let page = 1;
    let totalSynced = 0;

    while(true) {
        console.log(`📥 Pobieranie strony ${page}...`);
        try {
            const res = await fetch(`${baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=50`, {
                headers: { 'Authorization': `Basic ${auth}` }
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const products = await res.json();
            if (products.length === 0) break;

            const stmt = db.prepare(`
                INSERT INTO products (
                    id, name, slug, sku, price, regular_price, sale_price, 
                    status, stock_status, stock_quantity, image_url, 
                    categories, attributes, updated_at, synced_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    ?, ?, ?, ?
                ) ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    price = excluded.price,
                    stock_quantity = excluded.stock_quantity,
                    updated_at = excluded.updated_at
            `);

            const transaction = db.transaction((items) => {
                for (const p of items) {
                    stmt.run(
                        p.id,
                        p.name,
                        p.slug,
                        p.sku,
                        p.price,
                        p.regular_price,
                        p.sale_price,
                        p.status,
                        p.stock_status,
                        p.stock_quantity,
                        p.images[0]?.src || null,
                        JSON.stringify(p.categories.map(c => c.id)),
                        JSON.stringify(p.attributes),
                        Date.now(),
                        Date.now()
                    );
                }
            });

            transaction(products);
            totalSynced += products.length;
            console.log(`✅ Zapisano ${products.length} produktów (Razem: ${totalSynced})`);
            
            page++;
        } catch (e) {
            console.error('❌ Błąd:', e.message);
            break;
        }
    }
    
    console.log('🏁 Synchronizacja zakończona!');
}

sync();