import { db } from "@/lib/db";
import { erpSuppliers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { SuppliersTable } from "./_components/suppliers-table";
import { SupplierSheet } from "./_components/supplier-sheet";

export default async function SuppliersPage() {
    const suppliers = await db.query.erpSuppliers.findMany({
        orderBy: [desc(erpSuppliers.createdAt)],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Dostawcy</h2>
                    <p className="text-sm text-muted-foreground">
                        Lista dostawców towarów i usług.
                    </p>
                </div>
                <SupplierSheet />
            </div>

            <SuppliersTable data={suppliers} />
        </div>
    );
}


