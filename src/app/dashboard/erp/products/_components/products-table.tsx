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
import { Edit } from "lucide-react";
import Link from "next/link";

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
        <div className="rounded-md border">
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
    );
}
