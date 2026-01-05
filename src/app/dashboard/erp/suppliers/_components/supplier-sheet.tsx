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
import { SupplierForm, type SupplierData } from "./supplier-form";
import { useState } from "react";

interface SupplierSheetProps {
    supplier?: SupplierData;
    trigger?: React.ReactNode;
}

export function SupplierSheet({ supplier, trigger }: SupplierSheetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj Dostawcę
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{supplier ? "Edytuj Dostawcę" : "Nowy Dostawca"}</SheetTitle>
                    <SheetDescription>
                        {supplier ? "Edytuj dane dostawcy." : "Dodaj nowego dostawcę do bazy."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-4">
                    <SupplierForm onSuccess={() => setOpen(false)} initialData={supplier} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
