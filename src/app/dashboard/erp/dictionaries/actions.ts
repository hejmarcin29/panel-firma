'use server';

import { db } from "@/lib/db";
import { erpBrands, erpCollections, erpCategories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { processAndUploadImage } from "@/lib/r2/upload";

// --- CATEGORIES ---

export async function getCategories() {
    return await db.query.erpCategories.findMany({
        orderBy: [desc(erpCategories.createdAt)],
    });
}

export async function createCategory(name: string) {
    await db.insert(erpCategories).values({ name });
    revalidatePath('/dashboard/erp/dictionaries');
}

export async function deleteCategory(id: string) {
    try {
        await db.delete(erpCategories).where(eq(erpCategories.id, id));
        revalidatePath('/dashboard/erp/dictionaries');
    } catch (e) {
        console.error("Failed to delete category:", e);
        throw new Error("Nie można usunąć kategorii, która ma przypisane produkty.");
    }
}

// --- BRANDS ---

export async function getBrands() {
    return await db.query.erpBrands.findMany({
        orderBy: [desc(erpBrands.createdAt)],
    });
}

export async function createBrand(name: string) {
    await db.insert(erpBrands).values({ name });
    revalidatePath('/dashboard/erp/dictionaries');
}

export async function updateBrand(id: string, data: { name?: string, imageUrl?: string | null }) {
    await db.update(erpBrands)
        .set(data)
        .where(eq(erpBrands.id, id));
    revalidatePath('/dashboard/erp/dictionaries');
}

export async function uploadBrandLogo(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');

    return await processAndUploadImage({
        file,
        folderPath: 'brands/logos',
    });
}

export async function deleteBrand(id: string) {
    try {
        await db.delete(erpBrands).where(eq(erpBrands.id, id));
        revalidatePath('/dashboard/erp/dictionaries');
    } catch (e) {
        console.error("Failed to delete brand:", e);
        // Usually because of FK constraint (products)
        throw new Error("Nie można usunąć marki, która ma przypisane kolekcje lub produkty.");
    }
}

// --- COLLECTIONS ---

export async function getCollections() {
    return await db.query.erpCollections.findMany({
        with: {
            brand: true
        },
        orderBy: [desc(erpCollections.createdAt)],
    });
}

export async function createCollection(name: string, brandId: string) {
    await db.insert(erpCollections).values({
        name,
        brandId
    });
    revalidatePath('/dashboard/erp/dictionaries');
}

export async function deleteCollection(id: string) {
    try {
        await db.delete(erpCollections).where(eq(erpCollections.id, id));
        revalidatePath('/dashboard/erp/dictionaries');
    } catch (e) {
        console.error("Failed to delete collection:", e);
        throw new Error("Nie można usunąć kolekcji, która ma przypisane produkty.");
    }
}
