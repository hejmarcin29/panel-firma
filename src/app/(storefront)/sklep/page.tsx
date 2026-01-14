import { 
    getStoreProducts, 
    getStoreCategories, 
    getStoreBrands, 
    getStoreCollections,
    getStoreMountingMethods,
    getStoreFloorPatterns,
    getStoreWearClasses,
} from "./actions";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";
import { ProductGridAnimated } from "../_components/product-grid-animated";
import { SearchInput } from "../_components/search-input";
import { StoreFilters } from "../_components/store-filters";

export const metadata = {
    title: "Sklep | Podłogi, Panele, Montaż",
    description: "Zobacz naszą ofertę podłóg i paneli z montażem.",
};

export default async function ShopPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { q, category, brands, collections, mounting, pattern, wear } = await searchParams;
    const query = typeof q === 'string' ? q : undefined;
    const categorySlug = typeof category === 'string' ? category : undefined;
    
    // Parse array filters
    const brandSlugs = typeof brands === 'string' ? brands.split(',') : undefined;
    const collectionSlugs = typeof collections === 'string' ? collections.split(',') : undefined;
    
    const mountingSlugs = typeof mounting === 'string' ? mounting.split(',') : undefined;
    const patternSlugs = typeof pattern === 'string' ? pattern.split(',') : undefined;
    const wearSlugs = typeof wear === 'string' ? wear.split(',') : undefined;

    const [products, categoriesData, brandsData, collectionsData, mountingData, patternData, wearData, shopConfig] = await Promise.all([
        getStoreProducts(undefined, query, categorySlug, brandSlugs, collectionSlugs, mountingSlugs, patternSlugs, wearSlugs),
        getStoreCategories(),
        getStoreBrands(),
        getStoreCollections(),
        getStoreMountingMethods(),
        getStoreFloorPatterns(),
        getStoreWearClasses(),
        getShopConfig()
    ]);

    return (
        <div className="container min-h-screen py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-foreground">
                        {categorySlug ? `Kategoria: ${categoriesData.find(c => c.slug === categorySlug)?.name || categorySlug}` : "Wszystkie Produkty"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Znaleziono {products.length} produktów w ofercie.
                    </p>
                </div>

                {/* Search */}
                <SearchInput />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Sidebar Filters */}
                <StoreFilters 
                    categories={categoriesData} 
                    brands={brandsData} 
                    collections={collectionsData}
                    mountingMethods={mountingData}
                    floorPatterns={patternData}
                    wearClasses={wearData}
                />

                {/* Product Grid */}
                <div className="flex-1 w-full">
                    {/* Active Filters Summary could go here */}
                    
                    <ProductGridAnimated 
                        products={products}
                        showGrossPrices={shopConfig?.showGrossPrices ?? false}
                        vatRate={shopConfig?.vatRate ?? 0.23}
                    />
                </div>
            </div>
        </div>
    );
}
