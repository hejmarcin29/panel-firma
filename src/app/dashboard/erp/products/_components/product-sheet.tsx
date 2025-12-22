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

export function ProductSheet() {
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
                    <ProductForm onSuccess={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
