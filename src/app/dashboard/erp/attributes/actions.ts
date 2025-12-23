'use server';

import { db } from "@/lib/db";
import { erpAttributes, erpAttributeOptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAttributes() {
    return await db.query.erpAttributes.findMany({
        with: {
            options: {
                orderBy: [desc(erpAttributeOptions.order)],
            },
            category: true,
        },
        orderBy: [desc(erpAttributes.createdAt)],
    });
}

export async function createAttribute(data: { name: string; type: string; options?: string[] }) {
    const [attribute] = await db.insert(erpAttributes).values({
        name: data.name,
        type: data.type,
    }).returning();

    if (data.type === 'select' && data.options && data.options.length > 0) {
        await db.insert(erpAttributeOptions).values(
            data.options.map((value, index) => ({
                attributeId: attribute.id,
                value: value,
                order: index,
            }))
        );
    }

    revalidatePath("/dashboard/erp/attributes");
    return attribute;
}

export async function deleteAttribute(id: string) {
    try {
        // First delete options
        await db.delete(erpAttributeOptions).where(eq(erpAttributeOptions.attributeId, id));
        // Then delete attribute
        await db.delete(erpAttributes).where(eq(erpAttributes.id, id));
        revalidatePath("/dashboard/erp/attributes");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete attribute:", error);
        return { success: false, error: "Nie można usunąć atrybutu, który jest używany przez produkty." };
    }
}
