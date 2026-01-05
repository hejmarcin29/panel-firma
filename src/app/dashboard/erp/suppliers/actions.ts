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
