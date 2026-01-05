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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierSheet } from "./supplier-sheet";

interface Supplier {
    id: string;
    name: string;
    shortName: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    address?: any;
    nip?: string | null;
    website?: string | null;
    bankAccount?: string | null;
    paymentTerms?: number | null;
    description?: string | null;
}

interface SuppliersTableProps {
    data: Supplier[];
}

export function SuppliersTable({ data }: SuppliersTableProps) {
    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
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
                                        <SupplierSheet 
                                            supplier={supplier}
                                            trigger={
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
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
                        Brak dostawców.
                    </div>
                ) : (
                    data.map((supplier) => (
                        <Card key={supplier.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium leading-none">
                                        {supplier.shortName || supplier.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {supplier.name}
                                    </p>
                                </div>
                                <SupplierSheet 
                                    supplier={supplier}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span>{supplier.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Telefon:</span>
                                        <span>{supplier.phone || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                                            {supplier.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                                        </Badge>
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

