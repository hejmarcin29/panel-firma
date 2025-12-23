'use server';

import { db } from "@/lib/db";
import { erpProducts, erpPurchasePrices, erpProductAttributes } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProduct(data: any) {
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

