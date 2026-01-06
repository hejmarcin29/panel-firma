'use client';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Settings2, Trash2, Layers, RefreshCw } from "lucide-react";
import { seedSystemCategories, deleteAllProducts, runGlobalSync } from "../actions";
import { toast } from "sonner";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProductTools() {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleSync = async () => {
        try {
            toast.info("Rozpoczęto synchronizację...");
            const result = await runGlobalSync();
            toast.success(`Zsynchronizowano ${result.count} produktów`);
        } catch (e) {
            toast.error("Błąd synchronizacji: " + (e instanceof Error ? e.message : "Nieznany błąd"));
        }
    };

    const handleSeed = async () => {
        try {
            await seedSystemCategories();
            toast.success("Kategorie zostały utworzone");
        } catch {
            toast.error("Błąd tworzenia kategorii");
        }
    };

    const handleDeleteAll = async () => {
        try {
            await deleteAllProducts();
            toast.success("Wyczyszczono kartotekę");
            setIsDeleteOpen(false);
        } catch {
            toast.error("Błąd usuwania produktów");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSync}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Synchronizuj wszystko (CRON)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSeed}>
                        <Layers className="mr-2 h-4 w-4" />
                        Utwórz kategorie systemowe
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń wszystkie produkty
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ta operacja trwale usunie WSZYSTKIE produkty z kartoteki. Tej operacji nie można cofnąć.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">
                            Usuń wszystko
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
