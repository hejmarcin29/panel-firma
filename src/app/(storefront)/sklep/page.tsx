import { getStoreProducts, getStoreCategories, getStoreBrands, getStoreCollections } from "./actions";
import { ProductCard } from "../_components/product-card";
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
    const { q, category, brands, collections } = await searchParams;
    const query = typeof q === 'string' ? q : undefined;
    const categorySlug = typeof category === 'string' ? category : undefined;
    
    // Parse array filters
    const brandSlugs = typeof brands === 'string' ? brands.split(',') : undefined;
    const collectionSlugs = typeof collections === 'string' ? collections.split(',') : undefined;
    
    const [products, categoriesData, brandsData, collectionsData] = await Promise.all([
        getStoreProducts(undefined, query, categorySlug, brandSlugs, collectionSlugs),
        getStoreCategories(),
        getStoreBrands(),
        getStoreCollections()
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
                />

                {/* Product Grid */}
                <div className="flex-1 w-full">
                    {/* Active Filters Summary could go here */}
                    
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center border rounded-lg bg-muted/20">
                            <p className="text-muted-foreground text-lg">
                                Brak produktów spełniających kryteria wyszukiwania.
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                Spróbuj zmienić kategorię lub wyczyścić filtry.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
