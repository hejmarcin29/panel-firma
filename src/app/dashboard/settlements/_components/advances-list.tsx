'use client';

import { useTransition } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { approveAdvance } from '../actions';

type Advance = {
    id: string;
    requestDate: Date | string;
    amount: number;
    description: string | null;
    status: string;
    installer: {
        name: string | null;
        email: string;
    } | null;
};

interface AdvancesListProps {
    pending: Advance[];
    history: Advance[];
}

export function AdvancesList({ pending, history }: AdvancesListProps) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = (id: string) => {
        startTransition(async () => {
            try {
                await approveAdvance(id);
                toast.success('Zaliczka zatwierdzona (wypłacona)');
            } catch {
                toast.error('Wystąpił błąd');
            }
        });
    };

    const renderTable = (data: Advance[], showActions = false) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data wniosku</TableHead>
                        <TableHead>Montażysta</TableHead>
                        <TableHead>Opis</TableHead>
                        <TableHead>Kwota</TableHead>
                        <TableHead>Status</TableHead>
                        {showActions && <TableHead className="text-right">Akcje</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-muted-foreground">
                                Brak danych
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {format(new Date(item.requestDate), 'PPP', { locale: pl })}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.installer?.name || item.installer?.email}</div>
                                </TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>
                                    <span className="font-bold">{item.amount.toFixed(2)} PLN</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'paid' ? 'default' : 'secondary'}>
                                        {item.status === 'pending' && 'Oczekuje'}
                                        {item.status === 'paid' && 'Wypłacone'}
                                        {item.status === 'deducted' && 'Potrącone'}
                                    </Badge>
                                </TableCell>
                                {showActions && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Otwórz menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleApprove(item.id)} disabled={isPending}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Zatwierdź wypłatę
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Oczekujące wnioski</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderTable(pending, true)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Historia wypłaconych zaliczek</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderTable(history, false)}
                </CardContent>
            </Card>
        </div>
    );
}
