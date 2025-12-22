import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { erpProducts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsTable } from "./_components/products-table";

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
                <Link href="/dashboard/erp/products/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj Produkt
                    </Button>
                </Link>
            </div>

            <ProductsTable data={products} />
        </div>
    );
}
