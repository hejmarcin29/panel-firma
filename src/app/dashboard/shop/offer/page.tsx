
import { db } from '@/lib/db';
import { erpProducts, erpCategories, erpCollections, erpFloorPatterns, erpMountingMethods } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { ShopOfferTable } from './_components/data-table';
import { columns } from './_components/columns';

export default async function ShopOfferPage() {
    // 1. Fetch Products with Relations
    const products = await db.query.erpProducts.findMany({
        orderBy: [asc(erpProducts.name)],
        with: {
            category: true,
            collection: true,
            floorPatternDictionary: true,
            mountingMethodDictionary: true,
        },
        columns: {
            id: true,
            name: true,
            sku: true,
            isShopVisible: true,
            isPurchasable: true,
            isSampleAvailable: true,
            // we need relation IDs for filtering logic if client side filtering (TanStack Table defaults)
            categoryId: true,
            collectionId: true,
            floorPatternId: true,
            mountingMethodId: true,
        },
    });

    // 2. Fetch Dictionaries for Filters
    const [categories, collections, patterns, mountingMethods] = await Promise.all([
        db.query.erpCategories.findMany({ orderBy: [asc(erpCategories.name)] }),
        db.query.erpCollections.findMany({ orderBy: [asc(erpCollections.name)] }),
        db.query.erpFloorPatterns.findMany({ orderBy: [asc(erpFloorPatterns.name)] }),
        db.query.erpMountingMethods.findMany({ orderBy: [asc(erpMountingMethods.name)] })
    ]);

    // 3. Transform Dictionaries to { label, value } for DataTable
    const categoryOptions = categories.map(c => ({ label: c.name, value: c.name })); // Use Name for TanStack filtering by default accessor
    const collectionOptions = collections.map(c => ({ label: c.name, value: c.name }));
    const patternOptions = patterns.map(p => ({ label: p.name, value: p.name }));
    const mountingOptions = mountingMethods.map(m => ({ label: m.name, value: m.name }));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Zarządzanie Ofertą Sklepu</h3>
                <p className="text-sm text-muted-foreground">
                    Szybkie włączanie i wyłączanie produktów w modułach sprzedażowych.
                </p>
            </div>

            <ShopOfferTable 
                columns={columns} 
                data={products}
                categories={categoryOptions}
                collections={collectionOptions}
                patterns={patternOptions}
                mountingMethods={mountingOptions}
            />
        </div>
    );
}

