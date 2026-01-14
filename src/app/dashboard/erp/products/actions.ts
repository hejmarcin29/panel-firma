'use server';

import { db } from "@/lib/db";
import { erpProducts, erpPurchasePrices, erpProductAttributes, erpCategories, erpInventory } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { inArray } from "drizzle-orm";
import { syncProducts } from "@/lib/sync/products";
import { processAndUploadImage } from "@/lib/r2/upload";

export async function runGlobalSync() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    const result = await syncProducts();
    revalidatePath('/dashboard/erp/products');
    return result;
}

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

export async function bulkUpdateUnit(ids: string[], unit: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    if (ids.length === 0) return;

    await db.update(erpProducts)
        .set({ unit: unit, updatedAt: new Date() })
        .where(inArray(erpProducts.id, ids));
        
    revalidatePath('/dashboard/erp/products');
}

export async function bulkUpdateSampleStatus(ids: string[], isSample: boolean) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    if (ids.length === 0) return;

    await db.update(erpProducts)
        .set({ isSample: isSample, updatedAt: new Date() })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/erp/products');
}

export async function bulkAssignSupplier(ids: string[], supplierId: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    if (ids.length === 0) return;

    await db.update(erpProducts)
        .set({ supplierId: supplierId, updatedAt: new Date() })
        .where(inArray(erpProducts.id, ids));

    revalidatePath('/dashboard/erp/products');
}

export async function updateProductUnit(id: string, unit: string, packageSizeM2?: number | null) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Unauthorized');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { unit: unit, updatedAt: new Date() };
    if (packageSizeM2 !== undefined) {
        updateData.packageSizeM2 = packageSizeM2;
    }

    await db.update(erpProducts)
        .set(updateData)
        .where(eq(erpProducts.id, id));

    revalidatePath(`/dashboard/erp/products/${id}`);
    revalidatePath('/dashboard/erp/products');
    return { success: true };
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


export async function bulkAddPrice(data: {
    productIds: string[];
    supplierId: string;
    netPrice: number;
    vatRate?: number;
    leadTime?: string;
    isDefault?: boolean;
    useProductSku?: boolean;
}) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    if (data.productIds.length === 0) return { success: false, message: "No products selected" };

    try {
        // Fetch products to get SKUs if needed
        const productMap = new Map<string, string>(); // id -> sku
        if (data.useProductSku) {
            const products = await db.query.erpProducts.findMany({
                where: inArray(erpProducts.id, data.productIds),
                columns: { id: true, sku: true }
            });
            products.forEach(p => productMap.set(p.id, p.sku));
        }

        for (const productId of data.productIds) {
             // If setting as default, unset others for this product
            if (data.isDefault) {
                await db.update(erpPurchasePrices)
                    .set({ isDefault: false })
                    .where(eq(erpPurchasePrices.productId, productId));
            }

            // Insert new price
            await db.insert(erpPurchasePrices).values({
                productId: productId,
                supplierId: data.supplierId,
                netPrice: data.netPrice,
                vatRate: data.vatRate || 0.23,
                supplierSku: data.useProductSku ? productMap.get(productId) : undefined,
                isDefault: data.isDefault || false,
            });

            // Update lead time if provided
            if (data.leadTime) {
                await db.update(erpProducts)
                    .set({ leadTime: data.leadTime, updatedAt: new Date() })
                    .where(eq(erpProducts.id, productId));
            }
        }

        revalidatePath('/dashboard/erp/products');
        return { success: true };
    } catch (error) {
        console.error("Error in bulkAddPrice:", error);
        return { success: false, error: "Failed to add bulk prices" };
    }
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


import { processAndUploadImage } from "@/lib/r2/upload";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProduct(data: any, formData?: FormData) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        throw new Error('Unauthorized');
    }

    // 1. Upload Main Image (if present)
    let finalImageUrl = data.imageUrl;
    
    if (formData) {
        const imageFile = formData.get('imageFile') as File;
        if (imageFile && imageFile.size > 0) {
            // Temporary ID for path generation. 
            // Better approach: Insert product first, then upload, then update product.
            // But to avoid transaction complexity in R2, we will use a temp UUID for folder or just "new"
            // Wait, we need an ID for folder structure.
            // Let's generate UUID first.
            const newId = crypto.randomUUID();
            
            finalImageUrl = await processAndUploadImage({
                file: imageFile,
                folderPath: `products/${newId}`,
            });
            
            // Hack: We need to force the ID on insert to match folder
            data.id = newId; 
        }
    }

    const [product] = await db.insert(erpProducts).values({
        id: data.id, // Use generated ID if image was uploaded
        name: data.name,
        sku: data.sku,
        imageUrl: finalImageUrl, // Save R2 URL
        unit: data.unit,
        type: data.type,
        description: data.description,
        width: data.width,
        height: data.height,
        length: data.length,
        weight: data.weight,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        collectionId: data.collectionId || null,
        leadTime: data.leadTime,
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


export async function getAssignedProducts() {
    const user = await requireUser();

    // If architect, check for assigned products
    if (user.roles.includes('architect')) {
        const assignedIds = user.architectProfile?.assignedProductIds;
        
        if (Array.isArray(assignedIds) && assignedIds.length > 0) {
            const validIds = assignedIds.map(String);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const products: any[] = await db.query.erpProducts.findMany({
                where: (table, { eq, and, inArray }) => and(
                    eq(table.status, 'active'),
                    inArray(table.id, validIds)
                ),
                columns: {
                    id: true,
                    name: true,
                    sku: true,
                    price: true,
                    imageUrl: true,
                    regularPrice: true,
                    salePrice: true,
                    unit: true,
                },
                with: {
                    category: true
                }
            });
            return products;
        } else if (Array.isArray(assignedIds) && assignedIds.length === 0) {
             return [];
        }
    }

    // Default: Return all active ERP products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products: any[] = await db.query.erpProducts.findMany({
        where: (table, { eq }) => eq(table.status, 'active'),
        columns: {
            id: true,
            name: true,
            sku: true,
            price: true,
            imageUrl: true,
            regularPrice: true,
            salePrice: true,
            unit: true,
        },
        with: {
            category: true
        }
    });

    return products;
}

export async function syncProductsAction() {
    throw new Error('This function is deprecated. Use ERP Sync instead.');
}

export async function getProductDetails(id: string) {
    const product = await db.query.erpProducts.findFirst({
        where: eq(erpProducts.id, id),
        with: {
            category: true,
            brand: true,
            collection: true,
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

export type BulkEditData = {
    categoryId?: string;
    brandId?: string;
    collectionId?: string;
    supplierId?: string;
    status?: string;
    packageSizeM2?: number;
    price?: string;
    attributes?: { attributeId: string; value: string }[];
};

export async function bulkEditProducts(ids: string[], data: BulkEditData) {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) throw new Error('Unauthorized');

    if (ids.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productUpdates: any = {};

    if (data.categoryId) productUpdates.categoryId = data.categoryId === 'none' ? null : data.categoryId;
    if (data.brandId) productUpdates.brandId = data.brandId === 'none' ? null : data.brandId;
    if (data.collectionId) productUpdates.collectionId = data.collectionId === 'none' ? null : data.collectionId;
    if (data.supplierId) productUpdates.supplierId = data.supplierId === 'none' ? null : data.supplierId;
    if (data.status) productUpdates.status = data.status;
    if (data.packageSizeM2 !== undefined) productUpdates.packageSizeM2 = data.packageSizeM2;
    if (data.price) productUpdates.price = data.price;
    
    // Obsługa zmiany wagi produktu (może być null, string 'none' lub string z liczbą)
    // Ale w BulkEditData nie zdefiniowaliśmy weight, więc dodam to do typu jeśli będzie potrzeba.
    // Na razie skupiamy się na tym co zdefiniowane.

    if (Object.keys(productUpdates).length > 0) {
        productUpdates.updatedAt = new Date();
        await db.update(erpProducts)
            .set(productUpdates)
            .where(inArray(erpProducts.id, ids));
    }

    if (data.attributes && data.attributes.length > 0) {
        for (const attr of data.attributes) {
            // Delete existing values for this attribute for all selected products
            await db.delete(erpProductAttributes)
                .where(and(
                    inArray(erpProductAttributes.productId, ids),
                    eq(erpProductAttributes.attributeId, attr.attributeId)
                ));
            
            // Insert new values
            const newRecords = ids.map(pid => ({
                productId: pid,
                attributeId: attr.attributeId,
                value: attr.value
            }));

            // Tylko jeśli wartość nie jest pusta (opcjonalnie, zależy czy chcemy czyścić czy ustawiać)
            // Jeśli attr.value jest pusta, to po prostu usuwamy (co już zrobiliśmy wyżej).
            // Zakładamy, że jeśli value jest podana, to chcemy ją ustawić.
            if (attr.value) {
                await db.insert(erpProductAttributes).values(newRecords);
            }
        }
    }

    revalidatePath('/dashboard/erp/products');
}

