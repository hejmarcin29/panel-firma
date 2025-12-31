'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PORTAL_STEPS } from '@/lib/customer-portal-definitions';
import { FileText, Ruler, Calculator, CheckCircle2, Truck, Hammer, Check } from 'lucide-react';

const ICON_MAP = {
    'FileText': FileText,
    'Ruler': Ruler,
    'Calculator': Calculator,
    'CheckCircle2': CheckCircle2,
    'Truck': Truck,
    'Hammer': Hammer,
    'Check': Check
};

export function PortalTimelineDocs() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Dokumentacja Osi Czasu Klienta</CardTitle>
                <CardDescription>
                    Poniższa tabela opisuje logikę wyświetlania kroków w Panelu Klienta.
                    Zmiany w pliku <code>src/lib/customer-portal-definitions.ts</code> są automatycznie odzwierciedlane tutaj.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Ikona</TableHead>
                            <TableHead className="w-[200px]">Krok (Label)</TableHead>
                            <TableHead>Opis Biznesowy</TableHead>
                            <TableHead>Kiedy Aktywny (W toku)</TableHead>
                            <TableHead>Kiedy Zakończony (Zielony)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PORTAL_STEPS.map((step) => {
                            const Icon = ICON_MAP[step.iconName];
                            return (
                                <TableRow key={step.id}>
                                    <TableCell>
                                        <div className="p-2 bg-muted rounded-full w-fit">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {step.label}
                                        <div className="text-xs text-muted-foreground font-normal mt-1">
                                            ID: {step.id}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {step.adminDescription}
                                        <div className="text-xs text-muted-foreground mt-1 italic">
                                            Klient widzi: &quot;{step.description}&quot;
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                                            {step.conditionActive}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal">
                                            {step.conditionCompleted}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
