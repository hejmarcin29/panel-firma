'use client';

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, RefreshCw, Ban, Search, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { bulkUpdateSyncStatus, bulkAssignCategory, bulkDeleteProducts } from "../actions";
import { toast } from "sonner";
import { FolderInput, Trash2, DollarSign, Scale } from "lucide-react";
import { BulkPriceDialog } from "./bulk-price-dialog";
import { BulkUnitDialog } from "./bulk-unit-dialog";

interface Product {
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
    unit: string | null;
    type: string | null;
    status: string | null;
    category: { id: string; name: string } | null;
    source: string | null;
    isSyncEnabled: boolean | null;
    price: string | null;
    regularPrice: string | null;
    salePrice: string | null;
}

interface Category {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

interface ProductsTableProps {
    data: Product[];
    categories: Category[];
    suppliers: Supplier[];
}

const PriceDisplay = ({ price, salePrice, regularPrice }: { price: string | null, salePrice: string | null, regularPrice?: string | null }) => {
    // Determine effective price
    const effectivePriceStr = salePrice || price;
    if (!effectivePriceStr) return <span className="text-muted-foreground">-</span>;
    
    const val = parseFloat(effectivePriceStr);
    if (isNaN(val)) return <span className="text-muted-foreground">-</span>;

    const grossVal = val * 1.23;
    const fmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

    const isPromo = !!salePrice;

    return (
        <div className="flex flex-col items-end">
            {/* Old Price (if promo) - subtle above */}
            {isPromo && regularPrice && (
                 <span className="text-[10px] text-muted-foreground line-through opacity-70">
                    {fmt.format(parseFloat(regularPrice))}
                 </span>
            )}
            
            {/* Main Price (Netto) */}
            <span className={`font-medium ${isPromo ? 'text-orange-700 dark:text-orange-500 font-bold' : ''}`}>
                {fmt.format(val)} <span className="text-[10px] font-normal text-muted-foreground">netto</span>
            </span>

            {/* Gross Price */}
            <span className="text-xs text-muted-foreground">
                {fmt.format(grossVal)} <span className="text-[9px]">brutto</span>
            </span>
        </div>
    );
};

export function ProductsTable({ data, categories, suppliers = [] }: ProductsTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const filteredData = useMemo(() => {
        return data.filter((product) => {
            const matchesSearch = 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                product.sku.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || product.status === statusFilter;
            
            const matchesCategory = categoryFilter === "all" || (
                categoryFilter === "none" 
                    ? !product.category 
                    : product.category?.id === categoryFilter
            );

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [data, searchQuery, statusFilter, categoryFilter]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredData.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(x => x !== id));
        }
    };

    const handleBulkSync = async (enabled: boolean) => {
        try {
            await bulkUpdateSyncStatus(selectedIds, enabled);
            toast.success(enabled ? "Włączono synchronizację" : "Wyłączono synchronizację");
            setSelectedIds([]);
        } catch {
            toast.error("Wystąpił błąd");
        }
    };

    const handleBulkAssign = async (categoryId: string) => {
        try {
            await bulkAssignCategory(selectedIds, categoryId);
            toast.success("Przypisano kategorię");
            setSelectedIds([]);
        } catch {
            toast.error("Błąd przypisywania kategorii");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm("Czy na pewno usunąć zaznaczone produkty?")) return;
        try {
            await bulkDeleteProducts(selectedIds);
            toast.success("Usunięto produkty");
            setSelectedIds([]);
        } catch {
            toast.error("Błąd usuwania");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-lg border">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj (SKU, Nazwa)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie statusy</SelectItem>
                            <SelectItem value="active">Aktywne</SelectItem>
                            <SelectItem value="archived">Archiwum</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Kategoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie kategorie</SelectItem>
                            <SelectItem value="none">Bez kategorii</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md flex-wrap">
                    <span className="text-sm font-medium px-2">Zaznaczono: {selectedIds.length}</span>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                                <FolderInput className="mr-2 h-4 w-4" /> Przypisz kategorię
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                            {categories.map(cat => (
                                <DropdownMenuItem key={cat.id} onClick={() => handleBulkAssign(cat.id)}>
                                    {cat.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <BulkPriceDialog 
                        selectedIds={selectedIds} 
                        suppliers={suppliers} 
                        onSuccess={() => setSelectedIds([])}
                        trigger={
                            <Button size="sm" variant="outline">
                                <DollarSign className="mr-2 h-4 w-4" /> Ustaw cenę zakupu
                            </Button>
                        } 
                    />

                    <BulkUnitDialog 
                        selectedIds={selectedIds}
                        onSuccess={() => setSelectedIds([])}
                        trigger={
                            <Button size="sm" variant="outline">
                                <Scale className="mr-2 h-4 w-4" /> Zmień Jm
                            </Button>
                        }
                    />

                    <Button size="sm" variant="outline" onClick={() => handleBulkSync(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Włącz Sync
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkSync(false)}>
                        <Ban className="mr-2 h-4 w-4" /> Wyłącz Sync
                    </Button>
                    
                    <div className="flex-1" />
                    
                    <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Usuń zaznaczone
                    </Button>
                </div>
            )}

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox 
                                    checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead className="w-[60px]">Img</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Kategoria</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Jednostka</TableHead>
                            <TableHead className="text-right">Cena</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Brak produktów spełniających kryteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((product) => (
                                <TableRow 
                                    key={product.id}
                                    className={product.source === 'woocommerce' ? 'bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/30' : ''}
                                >
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedIds.includes(product.id)}
                                            onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {product.imageUrl ? (
                                            <div className="h-10 w-10 relative overflow-hidden rounded-md border bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={product.imageUrl} 
                                                    alt="Product" 
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 bg-muted rounded-md border flex items-center justify-center text-xs text-muted-foreground">
                                                -
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {product.sku}
                                            {product.source === 'woocommerce' && (
                                                <Badge variant="secondary" className="text-[10px] px-1 h-5">WP</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link 
                                                href={`/dashboard/erp/products/${product.id}`}
                                                className="font-medium hover:underline text-primary"
                                            >
                                                {product.name}
                                            </Link>
                                            {product.source === 'woocommerce' && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    Sync: {product.isSyncEnabled ? 'ON' : 'OFF'}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{product.category?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.type === 'service' ? 'secondary' : 'outline'}>
                                            {product.type === 'service' ? 'Usługa' : 'Towar'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{product.unit}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        <PriceDisplay 
                                            price={product.price} 
                                            salePrice={product.salePrice} 
                                            regularPrice={product.regularPrice} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                            {product.status === 'active' ? 'Aktywny' : 'Archiwum'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredData.length === 0 ? (
                    <div className="text-center p-8 border rounded-md text-muted-foreground">
                        Brak produktów spełniających kryteria.
                    </div>
                ) : (
                    filteredData.map((product) => (
                        <Card key={product.id} className={product.source === 'woocommerce' ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        <Checkbox 
                                            checked={selectedIds.includes(product.id)}
                                            onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                                        />
                                    </div>
                                    {product.imageUrl && (
                                        <div className="h-12 w-12 relative overflow-hidden rounded-md border bg-muted flex-shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={product.imageUrl} 
                                                alt="Product" 
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <Link href={`/dashboard/erp/products/${product.id}`}>
                                            <CardTitle className="text-base font-medium leading-none hover:underline text-primary">
                                                {product.name}
                                            </CardTitle>
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            {product.sku}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <Link href={`/dashboard/erp/products/${product.id}`}>
                                            <DropdownMenuItem>
                                                Edytuj
                                            </DropdownMenuItem>
                                        </Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="pl-6">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex gap-2">
                                        <Badge variant={product.type === 'service' ? 'secondary' : 'outline'}>
                                            {product.type === 'service' ? 'Usługa' : 'Towar'}
                                        </Badge>
                                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                            {product.status === 'active' ? 'Aktywny' : 'Archiwum'}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                        {product.unit}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

