'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { AddPriceDialog } from "./add-price-dialog";
import { deleteProductPrice, setMainSupplier } from "../actions";
import { toast } from "sonner";

interface Price {
    id: string;
    netPrice: number;
    supplierSku: string | null;
    isDefault: boolean | null;
    supplier: {
        id: string;
        name: string;
        shortName: string | null;
    };
}

interface ProductPricesProps {
    productId: string;
    prices: Price[];
    suppliers: { id: string; name: string; shortName: string | null }[];
}

export function ProductPrices({ productId, prices, suppliers }: ProductPricesProps) {

    async function handleDelete(priceId: string) {
        if (!confirm("Czy na pewno chcesz usunąć tę cenę?")) return;
        try {
            await deleteProductPrice(priceId, productId);
            toast.success("Cena usunięta");
        } catch {
            toast.error("Błąd usuwania");
        }
    }

    async function handleSetDefault(priceId: string) {
        try {
            await setMainSupplier(priceId, productId);
            toast.success("Główny dostawca zmieniony");
        } catch {
            toast.error("Błąd zmiany");
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Dostawcy i Ceny</h3>
                <AddPriceDialog productId={productId} suppliers={suppliers} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead>Dostawca</TableHead>
                            <TableHead>Kod u dostawcy</TableHead>
                            <TableHead className="text-right">Cena Netto</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Brak przypisanych dostawców.
                                </TableCell>
                            </TableRow>
                        ) : (
                            prices.map((price) => (
                                <TableRow key={price.id}>
                                    <TableCell>
                                        {price.isDefault && (
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {price.supplier.shortName || price.supplier.name}
                                    </TableCell>
                                    <TableCell>{price.supplierSku || '-'}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {price.netPrice.toFixed(2)} PLN
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {!price.isDefault && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleSetDefault(price.id)}
                                                title="Ustaw jako głównego dostawcę"
                                            >
                                                <Star className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(price.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
