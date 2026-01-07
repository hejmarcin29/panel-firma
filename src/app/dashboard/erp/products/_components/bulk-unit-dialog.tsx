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
import { Loader2, Scale } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdateUnit } from "../actions";

interface BulkUnitDialogProps {
    selectedIds: string[];
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

const COMMON_UNITS = [
    { value: 'szt', label: 'Sztuka (szt)' },
    { value: 'm2', label: 'Metr kwadratowy (m²)' },
    { value: 'mb', label: 'Metr bieżący (mb)' },
    { value: 'kpl', label: 'Komplet (kpl)' },
    { value: 'opak', label: 'Opakowanie (opak)' },
];

export function BulkUnitDialog({ selectedIds, onSuccess, trigger }: BulkUnitDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<string>("m2");

    async function handleSubmit() {
        if (!selectedUnit) return;
        
        setIsLoading(true);
        try {
            await bulkUpdateUnit(selectedIds, selectedUnit);
            toast.success(`Zaktualizowano jednostkę dla ${selectedIds.length} produktów`);
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
                        <Scale className="mr-2 h-4 w-4" />
                        Zmień jednostkę ({selectedIds.length})
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Masowa zmiana jednostki</DialogTitle>
                    <DialogDescription>
                        Wybrana jednostka zostanie przypisana do {selectedIds.length} produktów.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="unit">Wybierz jednostkę</Label>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                            <SelectTrigger id="unit">
                                <SelectValue placeholder="Wybierz jednostkę" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_UNITS.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value}>
                                        {unit.label}
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
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedUnit}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz zmiany
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
