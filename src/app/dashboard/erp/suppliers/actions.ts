'use server';

import { db } from "@/lib/db";
import { erpSuppliers } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

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
