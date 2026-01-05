'use server';

import { db } from "@/lib/db";
import { erpProducts, erpPurchasePrices, erpProductAttributes, products, erpCategories, erpInventory } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { logSystemEvent } from "@/lib/logging";
import { inArray } from "drizzle-orm";
import { getWooCredentials } from "./import-actions";

export async function bulkUpdateSyncStatus(ids: string[], enabled: boolean) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    if (ids.length === 0) return;

    await db.update(erpProducts)
        .set({ isSyncEnabled: enabled, updatedAt: new Date() })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/erp/products');
}

export async function seedSystemCategories() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    const categories = [
        { name: 'Panele - Click - Klasyczne' },
        { name: 'Panele - Click - Jodełka' },
        { name: 'Panele - Klejone - Klasyczne' },
        { name: 'Panele - Klejone - Jodełka' },
        { name: 'Chemia / Kleje' },
        { name: 'Listwy' },
        { name: 'Podkłady' },
    ];

    for (const cat of categories) {
        const existing = await db.query.erpCategories.findFirst({
            where: eq(erpCategories.name, cat.name)
        });

        if (!existing) {
            await db.insert(erpCategories).values({
                name: cat.name,
            });
        }
    }
    
    revalidatePath('/dashboard/erp/products');
}

export async function deleteAllProducts() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    // Delete related records first
    await db.delete(erpPurchasePrices);
    await db.delete(erpProductAttributes);
    await db.delete(erpInventory);

    // Delete all from erpProducts
    await db.delete(erpProducts);
    
    revalidatePath('/dashboard/erp/products');
}

export async function bulkAssignCategory(ids: string[], categoryId: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    if (ids.length === 0) return;

    await db.update(erpProducts)
        .set({ categoryId: categoryId, updatedAt: new Date() })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/erp/products');
}

export async function bulkDeleteProducts(ids: string[]) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    if (ids.length === 0) return;

    // Delete related records first
    await db.delete(erpPurchasePrices).where(inArray(erpPurchasePrices.productId, ids));
    await db.delete(erpProductAttributes).where(inArray(erpProductAttributes.productId, ids));
    await db.delete(erpInventory).where(inArray(erpInventory.productId, ids));

    await db.delete(erpProducts)
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/erp/products');
}

export async function toggleProductSync(id: string, enabled: boolean) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    try {
        await db.update(erpProducts)
            .set({ isSyncEnabled: enabled, updatedAt: new Date() })
            .where(eq(erpProducts.id, id));

        revalidatePath('/dashboard/erp/products');
        return { success: true };
    } catch (error) {
        console.error("Error toggling product sync:", error);
        return { success: false };
    }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProduct(data: any) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    const [product] = await db.insert(erpProducts).values({
        name: data.name,
        sku: data.sku,
        unit: data.unit,
        type: data.type,
        description: data.description,
        width: data.width,
        height: data.height,
        length: data.length,
        weight: data.weight,
        categoryId: data.categoryId || null,
    }).returning({ id: erpProducts.id });

    if (data.attributes && Array.isArray(data.attributes)) {
        for (const attr of data.attributes) {
            if (attr.attributeId && (attr.value || attr.optionId)) {
                await db.insert(erpProductAttributes).values({
                    productId: product.id,
                    attributeId: attr.attributeId,
                    value: attr.value, // For text/number types
                    optionId: attr.optionId, // For select types
                });
            }
        }
    }

    revalidatePath("/dashboard/erp/products");
    return { success: true, id: product.id };
}

export async function addProductPrice(data: {
    productId: string;
    supplierId: string;
    netPrice: number;
    supplierSku?: string;
    vatRate?: number;
    isDefault?: boolean;
}) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    // If setting as default, unset others
    if (data.isDefault) {
        await db.update(erpPurchasePrices)
            .set({ isDefault: false })
            .where(eq(erpPurchasePrices.productId, data.productId));
    }

    await db.insert(erpPurchasePrices).values({
        productId: data.productId,
        supplierId: data.supplierId,
        netPrice: data.netPrice,
        supplierSku: data.supplierSku,
        vatRate: data.vatRate || 0.23,
        isDefault: data.isDefault || false,
    });

    revalidatePath(`/dashboard/erp/products/${data.productId}`);
}

export async function deleteProductPrice(priceId: string, productId: string) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    await db.delete(erpPurchasePrices)
        .where(eq(erpPurchasePrices.id, priceId));
    
    revalidatePath(`/dashboard/erp/products/${productId}`);
}

export async function setMainSupplier(priceId: string, productId: string) {
    // Unset all for this product
    await db.update(erpPurchasePrices)
        .set({ isDefault: false })
        .where(eq(erpPurchasePrices.productId, productId));

    // Set new default
    await db.update(erpPurchasePrices)
        .set({ isDefault: true })
        .where(eq(erpPurchasePrices.id, priceId));

    revalidatePath(`/dashboard/erp/products/${productId}`);
}

// --- LEGACY ACTIONS (To be migrated) ---

export async function restoreProduct(id: number) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    await db.update(products)
        .set({ deletedAt: null })
        .where(eq(products.id, id));
    
    await logSystemEvent('restore_product', `Przywrócono produkt ${id}`, user.id);
    revalidatePath('/dashboard/settings');
}

export async function permanentDeleteProduct(id: number) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    await db.delete(products).where(eq(products.id, id));
    
    await logSystemEvent('permanent_delete_product', `Trwale usunięto produkt ${id}`, user.id);
    revalidatePath('/dashboard/settings');
}

export async function getAssignedProducts() {
    // For now, return all active products from legacy table
    // In future, this should filter by user permissions if needed
    return await db.query.products.findMany({
        where: (table, { isNull, eq, and }) => and(
            isNull(table.deletedAt),
            eq(table.status, 'publish')
        ),
        columns: {
            id: true,
            name: true
        }
    });
}

export async function syncProductsAction() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    const creds = await getWooCredentials();
    if (!creds) {
        throw new Error("Brak konfiguracji WooCommerce");
    }

    let page = 1;
    const perPage = 50;
    let syncedCount = 0;

    try {
        while (true) {
            const response = await fetch(`${creds.baseUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`, {
                headers: { 'Authorization': creds.authHeader },
                cache: 'no-store'
            });

            if (!response.ok) break;

            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) break;

            for (const item of data) {
                await db.insert(products).values({
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                    sku: item.sku,
                    price: item.price,
                    regularPrice: item.regular_price,
                    salePrice: item.sale_price,
                    status: item.status,
                    stockStatus: item.stock_status,
                    stockQuantity: item.stock_quantity,
                    imageUrl: item.images?.[0]?.src,
                    categories: item.categories,
                    attributes: item.attributes,
                    syncedAt: new Date(),
                }).onConflictDoUpdate({
                    target: products.id,
                    set: {
                        name: item.name,
                        slug: item.slug,
                        sku: item.sku,
                        price: item.price,
                        regularPrice: item.regular_price,
                        salePrice: item.sale_price,
                        status: item.status,
                        stockStatus: item.stock_status,
                        stockQuantity: item.stock_quantity,
                        imageUrl: item.images?.[0]?.src,
                        categories: item.categories,
                        attributes: item.attributes,
                        syncedAt: new Date(),
                        updatedAt: new Date(),
                    }
                });
                syncedCount++;
            }
            page++;
        }
        
        await logSystemEvent('sync_products', `Zsynchronizowano ${syncedCount} produktów (Legacy)`, user.id);
        revalidatePath('/dashboard/showroom');
        return { success: true, count: syncedCount };
    } catch (error) {
        console.error("Sync error:", error);
        throw new Error("Błąd synchronizacji");
    }
}

export async function getProductDetails(id: string) {
    const product = await db.query.erpProducts.findFirst({
        where: eq(erpProducts.id, id),
        with: {
            category: true,
            purchasePrices: {
                with: {
                    supplier: true
                }
            },
            attributes: {
                with: {
                    attribute: true,
                    option: true
                }
            }
        }
    });
    return product;
}

export async function getSuppliersList() {
    return await db.query.erpSuppliers.findMany({
        columns: {
            id: true,
            name: true,
            shortName: true,
        }
    });
}

