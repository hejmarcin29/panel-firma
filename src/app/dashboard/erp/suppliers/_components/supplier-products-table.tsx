'use client';

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateProductPurchaseInfo } from "../actions";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface Product {
    id: string;
    name: string;
    sku: string;
    purchasePriceNet: number | null;
    purchasePriceUpdated: Date | null;
    supplierSku: string | null;
    price: string | null;
    salePrice: string | null;
    unit: string | null;
}

interface SupplierProductsTableProps {
    products: Product[];
}

const MarginBadge = ({ purchase, sales }: { purchase: number, sales: number }) => {
    if (!sales || sales === 0) return <span className="text-muted-foreground">-</span>;
    
    const margin = ((sales - purchase) / sales) * 100;
    
    let color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    if (margin > 30) color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    else if (margin > 15) color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";

    return (
        <Badge variant="outline" className={`border-0 ${color}`}>
            {margin.toFixed(1)}%
        </Badge>
    );
};

const ProductRow = ({ product }: { product: Product }) => {
    const [purchasePrice, setPurchasePrice] = useState(product.purchasePriceNet?.toString() || "");
    const [supplierSku, setSupplierSku] = useState(product.supplierSku || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isChanged, setIsChanged] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProductPurchaseInfo(product.id, {
                purchasePriceNet: purchasePrice ? parseFloat(purchasePrice) : undefined,
                supplierSku: supplierSku || undefined
            });
            setIsChanged(false);
            toast.success("Zapisano zmiany");
        } catch (error) {
            toast.error("Błąd zapisu");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (type: 'price' | 'sku', value: string) => {
        if (type === 'price') setPurchasePrice(value);
        if (type === 'sku') setSupplierSku(value);
        setIsChanged(true);
    };

    // Calculate Sales Price (Netto)
    // Assuming product.price is Gross or Net? Usually Woo stores string.
    // In ProductsTable we did: parseFloat(product.salePrice || product.price)
    // Let's assume stored price is Net? Wait, in products-table: "const grossVal = val * 1.23;" implies `val` is Net.
    // So `product.price` is Net.
    
    const salesPriceNet = product.salePrice ? parseFloat(product.salePrice) : (product.price ? parseFloat(product.price) : 0);

    return (
        <TableRow>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                </div>
            </TableCell>
            <TableCell>
                <Input 
                    value={supplierSku} 
                    onChange={(e) => handleChange('sku', e.target.value)}
                    className="h-8 text-sm w-32"
                    placeholder="Kod dostawcy"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        step="0.01"
                        value={purchasePrice} 
                        onChange={(e) => handleChange('price', e.target.value)}
                        className="h-8 text-sm w-24 text-right"
                        placeholder="0.00"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    <span className="text-xs text-muted-foreground">PLN</span>
                </div>
                {product.purchasePriceUpdated && (
                    <div className="text-[10px] text-muted-foreground mt-1 text-right w-24">
                        Akt. {formatDistanceToNow(new Date(product.purchasePriceUpdated), { addSuffix: true, locale: pl })}
                    </div>
                )}
            </TableCell>
            <TableCell>
                <div className="flex flex-col items-end">
                    <span className="text-sm">{salesPriceNet > 0 ? salesPriceNet.toFixed(2) : '-'} PLN</span>
                </div>
            </TableCell>
            <TableCell>
                <MarginBadge purchase={parseFloat(purchasePrice) || 0} sales={salesPriceNet} />
            </TableCell>
            <TableCell>
                {isChanged && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}

export function SupplierProductsTable({ products }: SupplierProductsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplierSku && p.supplierSku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Input 
                    placeholder="Szukaj (Nazwa, SKU, Kod dostawcy)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produkt</TableHead>
                            <TableHead>Kod u Dostawcy</TableHead>
                            <TableHead>Cena Zakupu (Netto)</TableHead>
                            <TableHead>Cena Sprzedaży (Netto)</TableHead>
                            <TableHead>Marża</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Brak przypisanych produktów.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((product) => (
                                <ProductRow key={product.id} product={product} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
