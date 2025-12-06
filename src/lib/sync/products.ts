import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { getAppSettings, appSettingKeys } from '@/lib/settings';
import { sql } from 'drizzle-orm';

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
    const creds = await getWooCredentials();
    if (!creds) {
        throw new Error('WooCommerce settings are missing');
    }

    let page = 1;
    const perPage = 100;
    let allProducts: WooCommerceProduct[] = [];

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

        allProducts = [...allProducts, ...productsData];
        page++;
    }

    // Upsert products
    for (const product of allProducts) {
        await db.insert(products).values({
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            price: product.price,
            regularPrice: product.regular_price,
            salePrice: product.sale_price,
            status: product.status,
            stockStatus: product.stock_status,
            stockQuantity: product.stock_quantity,
            imageUrl: product.images[0]?.src || null,
            categories: JSON.stringify(product.categories.map(c => c.id)),
            attributes: JSON.stringify(product.attributes),
            syncedAt: new Date(),
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: products.id,
            set: {
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                regularPrice: product.regular_price,
                salePrice: product.sale_price,
                status: product.status,
                stockStatus: product.stock_status,
                stockQuantity: product.stock_quantity,
                imageUrl: product.images[0]?.src || null,
                categories: JSON.stringify(product.categories.map(c => c.id)),
                attributes: JSON.stringify(product.attributes),
                syncedAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    return { count: allProducts.length };
}
