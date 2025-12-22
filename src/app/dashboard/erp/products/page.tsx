import { db } from "@/lib/db";
import { erpProducts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsTable } from "./_components/products-table";
import { ProductSheet } from "./_components/product-sheet";

export default async function ProductsPage() {
    const products = await db.query.erpProducts.findMany({
        orderBy: [desc(erpProducts.createdAt)],
        with: {
            category: true,
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Kartoteka Towarowa</h2>
                    <p className="text-sm text-muted-foreground">
                        Lista wszystkich produktów i usług w systemie.
                    </p>
                </div>
                <ProductSheet />
            </div>

            <ProductsTable data={products} />
        </div>
    );
}

