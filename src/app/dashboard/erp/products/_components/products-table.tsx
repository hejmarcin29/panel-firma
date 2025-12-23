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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, RefreshCw, Ban } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { bulkUpdateSyncStatus } from "../actions";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    sku: string;
    unit: string | null;
    type: string | null;
    status: string | null;
    category: { name: string } | null;
    source: 'woocommerce' | 'local';
    isSyncEnabled: boolean | null;
}

interface ProductsTableProps {
    data: Product[];
}

export function ProductsTable({ data }: ProductsTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(data.map(p => p.id));
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

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <span className="text-sm font-medium px-2">Zaznaczono: {selectedIds.length}</span>
                    <Button size="sm" variant="outline" onClick={() => handleBulkSync(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Włącz Sync
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkSync(false)}>
                        <Ban className="mr-2 h-4 w-4" /> Wyłącz Sync
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
                                    checked={data.length > 0 && selectedIds.length === data.length}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Kategoria</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Jednostka</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Brak produktów.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((product) => (
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
                                            <span>{product.name}</span>
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
                                    <TableCell>
                                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                            {product.status === 'active' ? 'Aktywny' : 'Archiwum'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/erp/products/${product.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {data.length === 0 ? (
                    <div className="text-center p-8 border rounded-md text-muted-foreground">
                        Brak produktów.
                    </div>
                ) : (
                    data.map((product) => (
                        <Card key={product.id} className={product.source === 'woocommerce' ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium leading-none">
                                        {product.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {product.sku}
                                    </p>
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
                            <CardContent>
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

