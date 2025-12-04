'use server';

import { getAppSettings, appSettingKeys } from '@/lib/settings';

export interface WooCommerceProduct {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    date_created: string;
    date_modified: string;
    type: string;
    status: string;
    featured: boolean;
    catalog_visibility: string;
    description: string;
    short_description: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    date_on_sale_from: string | null;
    date_on_sale_from_gmt: string | null;
    date_on_sale_to: string | null;
    date_on_sale_to_gmt: string | null;
    price_html: string;
    on_sale: boolean;
    purchasable: boolean;
    total_sales: number;
    virtual: boolean;
    downloadable: boolean;
    downloads: unknown[];
    download_limit: number;
    download_expiry: number;
    external_url: string;
    button_text: string;
    tax_status: string;
    tax_class: string;
    manage_stock: boolean;
    stock_quantity: number | null;
    stock_status: string;
    backorders: string;
    backorders_allowed: boolean;
    backordered: boolean;
    sold_individually: boolean;
    weight: string;
    dimensions: {
        length: string;
        width: string;
        height: string;
    };
    shipping_required: boolean;
    shipping_taxable: boolean;
    shipping_class: string;
    shipping_class_id: number;
    reviews_allowed: boolean;
    average_rating: string;
    rating_count: number;
    related_ids: number[];
    upsell_ids: number[];
    cross_sell_ids: number[];
    parent_id: number;
    purchase_note: string;
    categories: {
        id: number;
        name: string;
        slug: string;
    }[];
    tags: {
        id: number;
        name: string;
        slug: string;
    }[];
    images: {
        id: number;
        date_created: string;
        date_created_gmt: string;
        date_modified: string;
        date_modified_gmt: string;
        src: string;
        name: string;
        alt: string;
    }[];
    attributes: {
        id: number;
        name: string;
        position: number;
        visible: boolean;
        variation: boolean;
        options: string[];
    }[];
    default_attributes: unknown[];
    variations: number[];
    grouped_products: number[];
    menu_order: number;
    meta_data: unknown[];
}

export interface WooCommerceCategory {
    id: number;
    name: string;
    slug: string;
    parent: number;
    count: number;
}

export interface WooCommerceAttribute {
    id: number;
    name: string;
    slug: string;
    type: string;
    order_by: string;
    has_archives: boolean;
}

export interface WooCommerceAttributeTerm {
    id: number;
    name: string;
    slug: string;
    count: number;
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

export async function getProducts(
    page: number = 1, 
    perPage: number = 20,
    categoryId?: number,
    attributeTermId?: number
): Promise<{ products: WooCommerceProduct[], total: number, totalPages: number }> {
    const creds = await getWooCredentials();
    if (!creds) {
        console.error('WooCommerce settings are missing');
        return { products: [], total: 0, totalPages: 0 };
    }

    let endpoint = `${creds.baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`;
    
    if (categoryId) {
        endpoint += `&category=${categoryId}`;
    }
    
    if (attributeTermId) {
        endpoint += `&attribute_term=${attributeTermId}`;
    }

    try {
        const response = await fetch(endpoint, {
            headers: {
                Authorization: creds.authHeader,
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            console.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
            return { products: [], total: 0, totalPages: 0 };
        }

        const total = parseInt(response.headers.get('x-wp-total') || '0', 10);
        const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '0', 10);
        const products = await response.json() as WooCommerceProduct[];

        return { products, total, totalPages };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { products: [], total: 0, totalPages: 0 };
    }
}

export async function getCategories(): Promise<WooCommerceCategory[]> {
    const creds = await getWooCredentials();
    if (!creds) return [];

    try {
        const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products/categories?per_page=100&hide_empty=true`, {
            headers: { Authorization: creds.authHeader },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) return [];
        return await response.json() as WooCommerceCategory[];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function getAttributes(): Promise<WooCommerceAttribute[]> {
    const creds = await getWooCredentials();
    if (!creds) return [];

    try {
        const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products/attributes`, {
            headers: { Authorization: creds.authHeader },
            next: { revalidate: 3600 }
        });

        if (!response.ok) return [];
        return await response.json() as WooCommerceAttribute[];
    } catch (error) {
        console.error('Error fetching attributes:', error);
        return [];
    }
}

export async function getAttributeTerms(attributeId: number): Promise<WooCommerceAttributeTerm[]> {
    const creds = await getWooCredentials();
    if (!creds) return [];

    try {
        const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products/attributes/${attributeId}/terms?per_page=100&hide_empty=true`, {
            headers: { Authorization: creds.authHeader },
            next: { revalidate: 3600 }
        });

        if (!response.ok) return [];
        return await response.json() as WooCommerceAttributeTerm[];
    } catch (error) {
        console.error('Error fetching attribute terms:', error);
        return [];
    }
}
