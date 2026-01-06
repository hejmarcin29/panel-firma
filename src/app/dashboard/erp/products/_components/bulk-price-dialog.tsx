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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Loader2 } from "lucide-react";
import { bulkAddPrice } from "../actions";
import { toast } from "sonner";

interface Supplier {
    id: string;
    name: string;
}

interface BulkPriceDialogProps {
    selectedIds: string[];
    suppliers: Supplier[];
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function BulkPriceDialog({ selectedIds, suppliers, onSuccess, trigger }: BulkPriceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [supplierId, setSupplierId] = useState("");
    const [netPrice, setNetPrice] = useState("");
    const [leadTime, setLeadTime] = useState("");
    const [vatRate, setVatRate] = useState("0.23");
    const [isDefault, setIsDefault] = useState(false);
    const [useProductSku, setUseProductSku] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!supplierId || !netPrice) {
            toast.error("Wybierz dostawcę i podaj cenę");
            return;
        }

        setIsLoading(true);
        try {
            await bulkAddPrice({
                productIds: selectedIds,
                supplierId,
                netPrice: parseFloat(netPrice),
                vatRate: parseFloat(vatRate),
                leadTime: leadTime || undefined,
                isDefault,
                useProductSku,
            });
            toast.success("Ceny i dostawcy dodani pomyślnie");
            setOpen(false);
            onSuccess();
            // Reset form
            setNetPrice("");
            setLeadTime("");
        } catch (error) {
            toast.error("Wystąpił błąd");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline">
                        <DollarSign className="mr-2 h-4 w-4" /> Masowe Ceny
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Masowe dodawanie ceny zakupu</DialogTitle>
                    <DialogDescription>
                        Przypisz dostawcę i cenę dla {selectedIds.length} wybranych produktów.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Dostawca</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz dostawcę" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cena Netto (PLN)</Label>
                            <Input 
                                type="number" 
                                min="0.01" 
                                step="0.01" 
                                placeholder="0.00" 
                                value={netPrice}
                                onChange={(e) => setNetPrice(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>STAWKA VAT</Label>
                            <Select value={vatRate} onValueChange={setVatRate}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0.23">23%</SelectItem>
                                    <SelectItem value="0.08">8%</SelectItem>
                                    <SelectItem value="0">0%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Czas realizacji (opcjonalnie)</Label>
                        <Input 
                            placeholder="np. 3-5 dni, 24h" 
                            value={leadTime}
                            onChange={(e) => setLeadTime(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Wypełnij tylko jeśli chcesz zaktualizować/nadpisać czas realizacji dla wszystkich zaznaczonych.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="useSku" 
                            checked={useProductSku} 
                            onCheckedChange={(c) => setUseProductSku(!!c)} 
                        />
                        <Label htmlFor="useSku" className="text-sm font-normal">
                            Użyj mojego SKU jako kodu u dostawcy
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="isDefault" 
                            checked={isDefault} 
                            onCheckedChange={(c) => setIsDefault(!!c)} 
                        />
                        <Label htmlFor="isDefault" className="text-sm font-normal">
                            Ustaw jako głównego dostawcę
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zapisz ({selectedIds.length})
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

