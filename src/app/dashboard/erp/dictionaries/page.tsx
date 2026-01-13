import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAttributes } from "../attributes/actions";
import { AttributesList } from "../attributes/_components/attributes-list";
import { AttributeSheet } from "../attributes/_components/attribute-sheet";
import { getBrands, getCollections, getCategories } from "./actions";
import { BrandsManager } from "./_components/brands-manager";
import { CollectionsManager } from "./_components/collections-manager";
import { CategoriesManager } from "./_components/categories-manager";

export default async function DictionariesPage() {
    const [attributes, brands, collections, categories] = await Promise.all([
        getAttributes(),
        getBrands(),
        getCollections(),
        getCategories()
    ]);

    return (
        <div className="space-y-6 container py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Słowniki Systemowe</h2>
                    <p className="text-muted-foreground">
                        Zarządzaj kategoriami, atrybutami, markami i kolekcjami produktów.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList>
                    <TabsTrigger value="categories">Kategorie</TabsTrigger>
                    <TabsTrigger value="brands">Marki (Producenci)</TabsTrigger>
                    <TabsTrigger value="collections">Kolekcje</TabsTrigger>
                    <TabsTrigger value="attributes">Atrybuty</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4">
                    <CategoriesManager initialData={categories} />
                </TabsContent>
                
                <TabsContent value="attributes" className="space-y-4">
                    <div className="flex justify-end">
                        <AttributeSheet />
                    </div>
                    <AttributesList data={attributes} />
                </TabsContent>
                
                <TabsContent value="brands" className="space-y-4">
                    <BrandsManager initialData={brands} />
                </TabsContent>
                
                <TabsContent value="collections" className="space-y-4">
                     <CollectionsManager initialData={collections} brands={brands} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
