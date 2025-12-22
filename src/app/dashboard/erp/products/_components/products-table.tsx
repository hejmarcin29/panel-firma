'use client';

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
import { Edit, Package, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
    id: string;
    name: string;
    sku: string;
    unit: string | null;
    type: string | null;
    status: string | null;
    category: { name: string } | null;
}

interface ProductsTableProps {
    data: Product[];
}

export function ProductsTable({ data }: ProductsTableProps) {
    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
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
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Brak produktów.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.sku}</TableCell>
                                    <TableCell>{product.name}</TableCell>
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
                        <Card key={product.id}>
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
        </>
    );
}

