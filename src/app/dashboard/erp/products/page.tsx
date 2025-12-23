import { db } from "@/lib/db";
import { erpProducts, erpCategories } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsTable } from "./_components/products-table";
import { ProductSheet } from "./_components/product-sheet";
import { getAttributes } from "../attributes/actions";
import { ImportWizard } from "./_components/import-wizard";

export default async function ProductsPage() {
    const [products, attributes, categories] = await Promise.all([
        db.query.erpProducts.findMany({
            orderBy: [desc(erpProducts.createdAt)],
            with: {
                category: true,
            }
        }),
        getAttributes(),
        db.query.erpCategories.findMany({
            orderBy: [desc(erpCategories.name)],
        })
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Kartoteka Towarowa</h2>
                    <p className="text-sm text-muted-foreground">
                        Lista wszystkich produktów i usług w systemie.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ImportWizard existingAttributes={attributes} />
                    <ProductSheet attributes={attributes} categories={categories} />
                </div>
            </div>

            <ProductsTable data={products} />
        </div>
    );
}

