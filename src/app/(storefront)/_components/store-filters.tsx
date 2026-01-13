'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string | null;
}

interface Brand {
    id: string;
    name: string;
    slug: string | null;
}

interface Collection {
    id: string;
    name: string;
    slug: string | null;
    brandId: string | null;
}

interface StoreFiltersProps {
    categories: Category[];
    brands: Brand[];
    collections: Collection[];
}

export function StoreFilters({ categories, brands, collections }: StoreFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse current filters
    const currentCategory = searchParams.get('category');
    const currentBrands = searchParams.get('brands')?.split(',') || [];
    const currentCollections = searchParams.get('collections')?.split(',') || [];
    const hasActiveFilters = currentCategory || currentBrands.length > 0 || currentCollections.length > 0;

    const handleBrandChange = (slug: string, checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        let newBrands = [...currentBrands];

        if (checked) {
            newBrands.push(slug);
        } else {
            newBrands = newBrands.filter(b => b !== slug);
        }

        if (newBrands.length > 0) {
            params.set('brands', newBrands.join(','));
        } else {
            params.delete('brands');
        }

        // Reset page when filtering
        params.delete('page');
        
        router.push(`/sklep?${params.toString()}`, { scroll: false });
    };

    const handleCollectionChange = (slug: string, checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        let newCols = [...currentCollections];

        if (checked) {
            newCols.push(slug);
        } else {
            newCols = newCols.filter(c => c !== slug);
        }

        if (newCols.length > 0) {
            params.set('collections', newCols.join(','));
        } else {
            params.delete('collections');
        }
         
        params.delete('page');
        router.push(`/sklep?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push('/sklep');
    };

    const FilterContent = () => (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 text-sm font-medium">Kategorie</h3>
                <div className="space-y-2">
                    <Link 
                        href="/sklep"
                        className={cn(
                            "block text-sm px-2 py-1.5 rounded-md transition-colors",
                            !currentCategory ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        Wszystkie produkty
                    </Link>
                    {categories.map((item) => (
                        <Link 
                            key={item.id} 
                            href={`/sklep?category=${item.slug}`}
                            className={cn(
                                "block text-sm px-2 py-1.5 rounded-md transition-colors",
                                currentCategory === item.slug ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>

            <Separator />

            <Accordion type="multiple" defaultValue={["brands", "collections"]} className="w-full">
                <AccordionItem value="brands" className="border-none">
                    <AccordionTrigger className="py-2 text-sm">Producenci / Marki</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            {brands.map((brand) => (
                                <div key={brand.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`brand-${brand.id}`} 
                                        checked={brand.slug ? currentBrands.includes(brand.slug) : false}
                                        onCheckedChange={(checked) => brand.slug && handleBrandChange(brand.slug, checked as boolean)}
                                    />
                                    <Label 
                                        htmlFor={`brand-${brand.id}`}
                                        className="text-sm font-normal cursor-pointer leading-none"
                                    >
                                        {brand.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="collections" className="border-none">
                    <AccordionTrigger className="py-2 text-sm">Kolekcje</AccordionTrigger>
                    <AccordionContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2 pt-2">
                                {collections.map((collection) => {
                                    // If brands are selected, only show collections from those brands?
                                    // Or show all? Usually better to disable unrelated ones, but for now show all or filter.
                                    // Let's implement simple smart filtering: if brand selected, show only its collections.
                                    // But we need to know relation.
                                    
                                    const isVisible = currentBrands.length === 0 || 
                                        !collection.brandId || // Show unassigned
                                        (collection.brandId && brands.find(b => b.id === collection.brandId && currentBrands.includes(b.slug || '')) !== undefined);

                                    if (!isVisible) return null;

                                    return (
                                        <div key={collection.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`col-${collection.id}`} 
                                                checked={collection.slug ? currentCollections.includes(collection.slug) : false}
                                                onCheckedChange={(checked) => collection.slug && handleCollectionChange(collection.slug, checked as boolean)}
                                            />
                                            <Label 
                                                htmlFor={`col-${collection.id}`}
                                                className="text-sm font-normal cursor-pointer leading-none"
                                            >
                                                {collection.name}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );

    return (
        <>
            {/* Desktop Filters */}
            <div className="hidden lg:block w-[250px] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="font-semibold">Filtry</h2>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                            Wyczyść
                        </Button>
                    )}
                </div>
                <FilterContent />
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden w-full">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filtrowanie i Kategorie
                            </span>
                            {(currentBrands.length > 0 || currentCollections.length > 0) && (
                                <Badge variant="secondary" className="rounded-sm">
                                    {currentBrands.length + currentCollections.length}
                                </Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                        <SheetHeader className="mb-6 text-left">
                            <SheetTitle>Filtry</SheetTitle>
                            <SheetDescription>
                                Dostosuj listę produktów do swoich potrzeb.
                            </SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                            <FilterContent />
                        </ScrollArea>
                        {hasActiveFilters && (
                            <div className="absolute bottom-6 left-6 right-6">
                                <Button className="w-full" onClick={clearFilters} variant="secondary">
                                    Wyczyść wszystkie
                                </Button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
