'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductForm } from "./product-form";
import { useState } from "react";

interface Attribute {
    id: string;
    name: string;
    type: string | null;
    options: { id: string; value: string; order: number | null }[];
}

interface Category {
    id: string;
    name: string;
}

interface ProductSheetProps {
    attributes?: Attribute[];
    categories?: Category[];
}

export function ProductSheet({ attributes = [], categories = [] }: ProductSheetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj Produkt
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Nowy Produkt</SheetTitle>
                    <SheetDescription>
                        Dodaj nowy produkt lub usługę do kartoteki.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <ProductForm 
                        onSuccess={() => setOpen(false)} 
                        availableAttributes={attributes} 
                        availableCategories={categories}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
