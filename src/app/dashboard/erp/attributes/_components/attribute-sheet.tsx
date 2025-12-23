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
import { AttributeForm } from "./attribute-form";
import { useState } from "react";

export function AttributeSheet() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nowy Atrybut
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[500px]">
                <SheetHeader>
                    <SheetTitle>Definicja Atrybutu</SheetTitle>
                    <SheetDescription>
                        Dodaj nową cechę, którą będziesz mógł przypisywać do produktów.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <AttributeForm onSuccess={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
