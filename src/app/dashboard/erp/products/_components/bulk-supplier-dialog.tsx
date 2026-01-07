'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bulkAssignSupplier } from "../actions";

interface Supplier {
    id: string;
    name: string;
}

interface BulkSupplierDialogProps {
    selectedIds: string[];
    suppliers: Supplier[];
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function BulkSupplierDialog({ selectedIds, suppliers, onSuccess, trigger }: BulkSupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");

    async function handleSubmit() {
        if (!selectedSupplier) return;
        
        setIsLoading(true);
        try {
            await bulkAssignSupplier(selectedIds, selectedSupplier);
            toast.success(`Przypisano dostawcę dla ${selectedIds.length} produktów`);
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error("Wystąpił błąd podczas aktualizacji");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Przypisz Dostawcę ({selectedIds.length})
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Masowe przypisanie dostawcy</DialogTitle>
                    <DialogDescription>
                        Wybrany dostawca zostanie przypisany do {selectedIds.length} produktów.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="supplier">Wybierz dostawcę</Label>
                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                            <SelectTrigger id="supplier">
                                <SelectValue placeholder="Wybierz dostawcę..." />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Anuluj
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedSupplier}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
