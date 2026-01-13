import { getStoreProducts, getStoreCategories } from "./actions";
import { ProductCard } from "../_components/product-card";
import { SearchInput } from "../_components/search-input";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Sklep | Podłogi, Panele, Montaż",
    description: "Zobacz naszą ofertę podłóg i paneli z montażem.",
};

export default async function ShopPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { q, category } = await searchParams;
    const query = typeof q === 'string' ? q : undefined;
    const categorySlug = typeof category === 'string' ? category : undefined;
    
    const [products, categories] = await Promise.all([
        getStoreProducts(undefined, query, categorySlug),
        getStoreCategories()
    ]);

    return (
        <div className="container min-h-screen py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-foreground">
                        {categorySlug ? `Kategoria: ${categories.find(c => c.slug === categorySlug)?.name || categorySlug}` : "Wszystkie Produkty"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Znaleziono {products.length} produktów w ofercie.
                    </p>
                </div>

                {/* Search */}
                <SearchInput />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
                <Link href="/sklep">
                    <Button 
                        variant={!categorySlug ? "default" : "outline"} 
                        size="sm"
                    >
                        Wszystkie
                    </Button>
                </Link>
                {categories.map((cat) => (
                    <Link key={cat.id} href={`/sklep?category=${cat.slug}`}>
                        <Button 
                            variant={categorySlug === cat.slug ? "default" : "outline"} 
                            size="sm"
                        >
                            {cat.name}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center">
                    <p className="text-muted-foreground text-lg">
                        Brak produktów spełniających kryteria wyszukiwania.
                    </p>
                    <p className="text-sm text-gray-400">
                        Spróbuj zmienić frazę wyszukiwania.
                    </p>
                </div>
            )}
        </div>
    );
}
