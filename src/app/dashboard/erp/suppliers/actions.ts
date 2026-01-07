'use server';

import { db } from "@/lib/db";
import { erpSuppliers } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createSupplier(data: any) {
    await db.insert(erpSuppliers).values({
        name: data.name,
        shortName: data.shortName,
        nip: data.nip,
        email: data.email,
        phone: data.phone,
        website: data.website,
        bankAccount: data.bankAccount,
        paymentTerms: data.paymentTerms,
        description: data.description,
        address: {
            street: data.street,
            city: data.city,
            zip: data.zip,
            country: data.country,
        },
    });
    revalidatePath("/dashboard/erp/suppliers");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateSupplier(id: string, data: any) {
    await db.update(erpSuppliers).set({
        name: data.name,
        shortName: data.shortName,
        nip: data.nip,
        email: data.email,
        phone: data.phone,
        website: data.website,
        bankAccount: data.bankAccount,
        paymentTerms: data.paymentTerms,
        description: data.description,
        address: {
            street: data.street,
            city: data.city,
            zip: data.zip,
            country: data.country,
        },
        updatedAt: new Date(),
    }).where(eq(erpSuppliers.id, id));
    revalidatePath("/dashboard/erp/suppliers");
}

export async function getSupplier(id: string) {
    return await db.query.erpSuppliers.findFirst({
        where: eq(erpSuppliers.id, id),
    });
}

export async function getSupplierProducts(supplierId: string) {
    return await db.query.erpProducts.findMany({
        where: (table, { eq }) => eq(table.supplierId, supplierId),
        columns: {
            id: true,
            name: true,
            sku: true,
            purchasePriceNet: true,
            purchasePriceUpdated: true,
            supplierSku: true,
            price: true, // Netto sprzedaży (string)
            salePrice: true, // Promo
            regularPrice: true,
            unit: true,
        }
    });
}

import { erpProducts } from "@/lib/db/schema";

export async function updateProductPurchaseInfo(productId: string, data: { purchasePriceNet?: number, supplierSku?: string }) {
    await db.update(erpProducts)
        .set({ 
            ...data,
            purchasePriceUpdated: new Date()
        })
        .where(eq(erpProducts.id, productId));
    
    revalidatePath('/dashboard/erp/suppliers');
}
