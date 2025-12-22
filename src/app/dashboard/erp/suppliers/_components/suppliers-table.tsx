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

interface Supplier {
    id: string;
    name: string;
    shortName: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
}

interface SuppliersTableProps {
    data: Supplier[];
}

export function SuppliersTable({ data }: SuppliersTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nazwa</TableHead>
                        <TableHead>Skrót</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Brak dostawców.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>{supplier.shortName}</TableCell>
                                <TableCell>{supplier.email}</TableCell>
                                <TableCell>{supplier.phone}</TableCell>
                                <TableCell>
                                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                                        {supplier.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/erp/suppliers/${supplier.id}`}>
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
