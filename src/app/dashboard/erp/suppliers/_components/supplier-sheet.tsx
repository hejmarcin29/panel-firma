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
import { SupplierForm } from "./supplier-form";
import { useState } from "react";

export function SupplierSheet() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj Dostawcę
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Nowy Dostawca</SheetTitle>
                    <SheetDescription>
                        Dodaj nowego dostawcę do bazy.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <SupplierForm onSuccess={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
