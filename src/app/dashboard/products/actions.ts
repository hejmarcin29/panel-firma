'use server';

import { db } from '@/lib/db';
import { products, architectProducts, users } from '@/lib/db/schema';
import { like, eq, and, desc, asc, count, inArray, sql, isNull } from 'drizzle-orm';
import { getAppSettings, appSettingKeys } from '@/lib/settings';
import { syncProducts } from '@/lib/sync/products';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function getArchitects() {
    // Note: Drizzle query builder for JSON arrays is tricky, using raw SQL for reliability
    const result = await db.execute(sql`
        SELECT id, name, email FROM users 
        WHERE roles::jsonb ? 'architect'
    `);
    return result.rows as { id: string; name: string; email: string }[];
}

export async function getAssignedProducts(architectId: string) {
    const assignments = await db.query.architectProducts.findMany({
        where: eq(architectProducts.architectId, architectId),
        with: {
            product: true
        }
    });
    return assignments.map(a => a.product);
}

export async function toggleProductAssignment(architectId: string, productId: number, isAssigned: boolean) {
    if (isAssigned) {
        // Assign
        await db.insert(architectProducts).values({
            id: randomUUID(),
            architectId,
            productId: productId.toString(), // Assuming product ID is number in DB but text in relation or vice versa, checking schema... products.id is integer in schema.ts
        }).onConflictDoNothing();
    } else {
        // Unassign
        await db.delete(architectProducts)
            .where(and(
                eq(architectProducts.architectId, architectId),
                eq(architectProducts.productId, productId.toString())
            ));
    }
    revalidatePath('/dashboard/products');
}

export async function bulkUpdateMontageSettings(
    productIds: number[],
    action: 'SET_PANEL' | 'SET_SKIRTING' | 'DISABLE'
) {
    if (!productIds.length) return { success: false };

    let updateData: { isForMontage: boolean; montageType: 'panel' | 'skirting' | 'other' | null } = {
        isForMontage: false,
        montageType: null
    };

    if (action === 'SET_PANEL') {
        updateData = { isForMontage: true, montageType: 'panel' };
    } else if (action === 'SET_SKIRTING') {
        updateData = { isForMontage: true, montageType: 'skirting' };
    } else if (action === 'DISABLE') {
        updateData = { isForMontage: false, montageType: null };
    }

    await db.update(products)
        .set(updateData)
        .where(inArray(products.id, productIds));

    revalidatePath('/dashboard/products');
    return { success: true };
}

export async function updateProductMontageSettings(
    productId: number, 
    isForMontage: boolean, 
    montageType: 'panel' | 'skirting' | 'other' | null
) {
    await db.update(products)
        .set({ isForMontage, montageType })
        .where(eq(products.id, productId));
    
    return { success: true };
}

export async function syncProductsAction() {
    return await syncProducts();
}

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
    isForMontage?: boolean;
    montageType?: 'panel' | 'skirting' | 'other' | null;
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
    options: {
        page?: number;
        perPage?: number;
        search?: string;
        scope?: 'public' | 'private' | 'all';
        categoryId?: number;
        brandTermId?: number;
        sort?: string;
    } = {}
): Promise<{ products: WooCommerceProduct[], total: number, totalPages: number }> {
    const { 
        page = 1, 
        perPage = 20, 
        search = '', 
        scope = 'public',
        categoryId,
        brandTermId,
        sort = 'date_desc'
    } = options;

    const creds = await getWooCredentials();
    if (!creds) {
        console.error('WooCommerce settings are missing');
        return { products: [], total: 0, totalPages: 0 };
    }

    let endpoint = `${creds.baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`;
    
    // Search
    if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
    }

    // Scope / Status
    if (scope === 'public') {
        endpoint += `&status=publish`;
    } else if (scope === 'private') {
        endpoint += `&status=private`;
    } else {
        endpoint += `&status=any`;
    }

    // Category
    if (categoryId) {
        endpoint += `&category=${categoryId}`;
    }
    
    // Brand (Attribute)
    if (brandTermId) {
        endpoint += `&attribute_term=${brandTermId}`;
    }

    // Sort
    if (sort) {
        const [orderby, order] = sort.split('_');
        if (orderby && order) {
            endpoint += `&orderby=${orderby}&order=${order}`;
        }
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
        let products = await response.json() as WooCommerceProduct[];

        // Client-side filtering for custom meta if needed (e.g. _pp_made_private_by_collection)
        // This is a fallback since we can't easily filter by meta in standard API
        if (scope === 'public') {
             products = products.filter(p => {
                 const isPrivateMeta = (p.meta_data as { key: string; value: unknown }[]).find(m => m.key === '_pp_made_private_by_collection' && m.value === '1');
                 return !isPrivateMeta;
             });
        } else if (scope === 'private') {
             // For private scope, we might want to include those with the meta flag even if status is publish
             // But since we fetched status=private, we only got private status ones.
             // To fully support the requirement "private = status:private OR meta:private", we would need to fetch status=any and filter here.
             // But that messes up pagination. 
             // For now, we stick to status=private for the API call.
        }

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

export async function getProductsFromDb(
    options: {
        page?: number;
        perPage?: number;
        search?: string;
        scope?: 'public' | 'private' | 'all';
        categoryId?: number;
        brandTermId?: number;
        brandName?: string;
        attributeFilters?: Record<string, string>;
        sort?: string;
    } = {}
): Promise<{ products: WooCommerceProduct[], total: number, totalPages: number }> {
    const { 
        page = 1, 
        perPage = 20, 
        search = '', 
        scope = 'public',
        categoryId,
        brandName,
        attributeFilters,
        sort = 'date_desc'
    } = options;

    const offset = (page - 1) * perPage;
    
    let whereClause = undefined;
    const conditions = [
        isNull(products.deletedAt)
    ];

    if (search) {
        conditions.push(like(products.name, `%${search}%`));
    }

    if (scope === 'public') {
        conditions.push(eq(products.status, 'publish'));
    } else if (scope === 'private') {
        conditions.push(eq(products.status, 'private'));
    }

    if (categoryId) {
        conditions.push(sql`${products.categories}::text LIKE ${`%${categoryId}%`}`);
    }

    if (brandName) {
        conditions.push(sql`${products.attributes}::text LIKE ${`%${brandName}%`}`);
    }

    if (attributeFilters) {
        Object.values(attributeFilters).forEach(termName => {
            if (termName) {
                conditions.push(sql`${products.attributes}::text LIKE ${`%${termName}%`}`);
            }
        });
    }
    
    if (conditions.length > 0) {
        whereClause = and(...conditions);
    }

    const totalResult = await db.select({ count: count() }).from(products).where(whereClause);
    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / perPage);

    let orderBy = desc(products.updatedAt);
    if (sort === 'date_asc') orderBy = asc(products.updatedAt);
    if (sort === 'price_desc') orderBy = desc(products.price);
    if (sort === 'price_asc') orderBy = asc(products.price);
    if (sort === 'title_asc') orderBy = asc(products.name);
    if (sort === 'title_desc') orderBy = desc(products.name);

    const dbProducts = await db.select()
        .from(products)
        .where(whereClause)
        .limit(perPage)
        .offset(offset)
        .orderBy(orderBy);

    const mappedProducts: WooCommerceProduct[] = dbProducts.map(p => {
        let categories: number[] = [];
        if (typeof p.categories === 'string') {
            try {
                const parsed = JSON.parse(p.categories);
                if (Array.isArray(parsed)) {
                    categories = parsed;
                }
            } catch {
                categories = [];
            }
        } else if (Array.isArray(p.categories)) {
            categories = p.categories as number[];
        }

        let attributes: WooCommerceProduct['attributes'] = [];
        if (typeof p.attributes === 'string') {
            try {
                const parsed = JSON.parse(p.attributes);
                if (Array.isArray(parsed)) {
                    attributes = parsed;
                }
            } catch {
                attributes = [];
            }
        } else if (Array.isArray(p.attributes)) {
            attributes = p.attributes as WooCommerceProduct['attributes'];
        }

        return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku || '',
            price: p.price || '',
            regular_price: p.regularPrice || '',
            sale_price: p.salePrice || '',
            status: p.status,
            stock_status: p.stockStatus || 'instock',
            stock_quantity: p.stockQuantity,
            images: p.imageUrl ? [{ src: p.imageUrl, id: 0, date_created: '', date_created_gmt: '', date_modified: '', date_modified_gmt: '', name: '', alt: '' }] : [],
            categories: categories.map((id: number) => ({ id, name: '', slug: '' })),
            attributes: attributes,
            permalink: '',
            date_created: '',
            date_modified: p.updatedAt.toISOString(),
            type: 'simple',
            featured: false,
            catalog_visibility: 'visible',
            description: '',
            short_description: '',
            date_on_sale_from: null,
            date_on_sale_from_gmt: null,
            date_on_sale_to: null,
            date_on_sale_to_gmt: null,
            price_html: '',
            on_sale: false,
            purchasable: true,
            total_sales: 0,
            virtual: false,
            downloadable: false,
            downloads: [],
            download_limit: 0,
            download_expiry: 0,
            external_url: '',
            button_text: '',
            tax_status: 'taxable',
            tax_class: '',
            manage_stock: false,
            backorders: 'no',
            backorders_allowed: false,
            backordered: false,
            sold_individually: false,
            weight: '',
            dimensions: { length: '', width: '', height: '' },
            shipping_required: true,
            shipping_taxable: true,
            shipping_class: '',
            shipping_class_id: 0,
            reviews_allowed: true,
            average_rating: '0.00',
            rating_count: 0,
            related_ids: [],
            upsell_ids: [],
            cross_sell_ids: [],
            parent_id: 0,
            purchase_note: '',
            tags: [],
            default_attributes: [],
            variations: [],
            grouped_products: [],
            menu_order: 0,
            meta_data: [],
            isForMontage: p.isForMontage ?? false,
            montageType: p.montageType,
        };
    });

    return { products: mappedProducts, total, totalPages };
}

export async function deleteProduct(id: number) {
    await db.update(products)
        .set({ deletedAt: new Date() })
        .where(eq(products.id, id));
    
    revalidatePath('/dashboard/products');
}

export async function restoreProduct(id: number) {
    await db.update(products)
        .set({ deletedAt: null })
        .where(eq(products.id, id));
    
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/settings');
}

export async function permanentDeleteProduct(id: number) {
    await db.delete(products)
        .where(eq(products.id, id));
    
    revalidatePath('/dashboard/settings');
}
