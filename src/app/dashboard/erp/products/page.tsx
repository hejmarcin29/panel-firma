import { db } from "@/lib/db";
import { erpProducts, erpCategories } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsTable } from "./_components/products-table";
import { ProductSheet } from "./_components/product-sheet";
import { getAttributes } from "../attributes/actions";
import { ImportWizard } from "./_components/import-wizard";
import { ProductTools } from "./_components/product-tools";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link"; // Added Link
import { Button } from "@/components/ui/button"; // Added Button
import { Book } from "lucide-react"; // Added Icon

import { getBrands, getCollections } from "../dictionaries/actions";

export default async function ProductsPage() {
    const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        redirect('/dashboard');
    }

    const [products, attributes, categories, suppliers, brands, collections, mountingMethods, floorPatterns, wearClasses, structures] = await Promise.all([
        db.query.erpProducts.findMany({
            orderBy: [desc(erpProducts.createdAt)],
            with: {
                category: true,
                brand: true, // Fetch Brand Name for Table
            }
        }),
        getAttributes(),
        db.query.erpCategories.findMany({
            orderBy: [desc(erpCategories.name)],
        }),
        db.query.erpSuppliers.findMany({
            orderBy: [desc(erpProducts.createdAt)],
            columns: {
                id: true,
                name: true,
                shortName: true,
            }
        }),
        getBrands(),
        getCollections(),
        db.query.erpMountingMethods.findMany(),
        db.query.erpFloorPatterns.findMany(),
        db.query.erpWearClasses.findMany(),
        db.query.erpStructures.findMany(),
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
                    <ProductTools />
                    <Link href="/dashboard/erp/dictionaries">
                        <Button variant="outline" className="gap-2">
                            <Book className="h-4 w-4" />
                            Słowniki
                        </Button>
                    </Link>
                    <ImportWizard existingAttributes={attributes} />
                    <ProductSheet 
                        attributes={attributes} 
                        categories={categories} 
                        brands={brands}
                        collections={collections}
                    />
                </div>
            </div>

            <ProductsTable 
                data={products} 
                categories={categories} 
                suppliers={suppliers} 
                brands={brands} 
                collections={collections} 
                attributes={attributes}
                mountingMethods={mountingMethods}
                floorPatterns={floorPatterns}
                wearClasses={wearClasses}
                structures={structures}
            />
        </div>
    );
}

