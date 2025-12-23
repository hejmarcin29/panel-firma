import { db } from '@/lib/db';
import { erpProducts } from '@/lib/db/schema';
import { getAppSettings, appSettingKeys } from '@/lib/settings';
import { eq, and } from 'drizzle-orm';

interface WooCommerceProduct {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    status: string;
    stock_status: string;
    stock_quantity: number | null;
    images: { src: string }[];
    categories: { id: number; name: string }[];
    attributes: { id: number; name: string; options: string[] }[];
}

async function getWooCredentials() {
    const settings = await getAppSettings([
        appSettingKeys.wooUrl,
        appSettingKeys.wooConsumerKey,
        appSettingKeys.wooConsumerSecret
    ]);

    const url = settings[appSettingKeys.wooUrl];
    const consumerKey = settings[appSettingKeys.wooConsumerKey];
    const consumerSecret = settings[appSettingKeys.wooConsumerSecret];

    if (!url || !consumerKey || !consumerSecret) {
        return null;
    }

    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    return { baseUrl, authHeader };
}

export async function syncProducts() {
    // Check if global sync automation is enabled
    const settings = await getAppSettings([appSettingKeys.montageNotifications]);
    const notificationsJson = settings[appSettingKeys.montageNotifications];
    if (notificationsJson) {
        try {
            const notifications = JSON.parse(notificationsJson);
            if (notifications['cron_sync_products'] === false) {
                console.log('Sync products cron is disabled in settings');
                return { count: 0 };
            }
        } catch (e) {
            console.error('Failed to parse notifications settings', e);
        }
    }

    const creds = await getWooCredentials();
    if (!creds) {
        throw new Error('WooCommerce settings are missing');
    }

    // 1. Get all local products that have sync enabled and are from woo
    const localProducts = await db.query.erpProducts.findMany({
        where: and(
            eq(erpProducts.source, 'woocommerce'),
            eq(erpProducts.isSyncEnabled, true)
        )
    });

    if (localProducts.length === 0) {
        return { count: 0 };
    }

    // Map for quick lookup: wooId -> localProduct, sku -> localProduct
    const productsByWooId = new Map(localProducts.filter(p => p.wooId).map(p => [p.wooId, p]));
    const productsBySku = new Map(localProducts.filter(p => p.sku).map(p => [p.sku, p]));

    let page = 1;
    const perPage = 100;
    let updatedCount = 0;

    while (true) {
        const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`, {
            headers: {
                'Authorization': creds.authHeader
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const productsData = await response.json() as WooCommerceProduct[];
        if (productsData.length === 0) {
            break;
        }

        for (const wooProduct of productsData) {
            // Find matching local product
            let localProduct = productsByWooId.get(wooProduct.id);
            if (!localProduct && wooProduct.sku) {
                localProduct = productsBySku.get(wooProduct.sku);
            }

            if (localProduct) {
                // Update
                await db.update(erpProducts).set({
                    name: wooProduct.name,
                    price: wooProduct.price,
                    regularPrice: wooProduct.regular_price,
                    salePrice: wooProduct.sale_price,
                    stockQuantity: wooProduct.stock_quantity,
                    status: wooProduct.status === 'publish' ? 'active' : 'archived',
                    updatedAt: new Date(),
                }).where(eq(erpProducts.id, localProduct.id));
                updatedCount++;
            }
        }
        page++;
    }
    return { count: updatedCount };
}
