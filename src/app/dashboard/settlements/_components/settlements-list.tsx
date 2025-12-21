'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CheckCircle2, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { updateSettlementStatus, paySettlementWithDeductions } from '../actions';

type Settlement = {
    id: string;
    montageId: string;
    status: string;
    totalAmount: number;
    createdAt: Date | string;
    installerId: string;
    montage: {
        clientName: string;
        address: string | null;
        installationAddress: string | null;
        installationCity: string | null;
    } | null;
    installer: {
        name: string | null;
        email: string;
    } | null;
};

type Advance = {
    id: string;
    amount: number;
    installerId: string;
    requestDate: Date | string;
    description: string | null;
};

interface SettlementsListProps {
    data: Settlement[];
    pendingAdvances?: Advance[]; // Pass all pending advances to filter client-side
    isHistory?: boolean;
}

export function SettlementsList({ data, pendingAdvances = [], isHistory = false }: SettlementsListProps) {
    const [isPending, startTransition] = useTransition();
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
    const [selectedAdvances, setSelectedAdvances] = useState<string[]>([]);

    const handleStatusChange = (id: string, status: 'paid' | 'pending') => {
        startTransition(async () => {
            try {
                await updateSettlementStatus(id, status);
                toast.success('Status został zaktualizowany');
            } catch {
                toast.error('Wystąpił błąd');
            }
        });
    };

    const openPaymentDialog = (settlement: Settlement) => {
        setSelectedSettlement(settlement);
        setSelectedAdvances([]);
        setPaymentDialogOpen(true);
    };

    const handlePayWithDeductions = () => {
        if (!selectedSettlement) return;

        startTransition(async () => {
            try {
                await paySettlementWithDeductions(selectedSettlement.id, selectedAdvances);
                setPaymentDialogOpen(false);
                toast.success('Rozliczenie wypłacone (z potrąceniami)');
            } catch (error) {
                toast.error('Wystąpił błąd');
                console.error(error);
            }
        });
    };

    // Filter advances for the selected installer
    const installerAdvances = selectedSettlement 
        ? pendingAdvances.filter(a => a.installerId === selectedSettlement.installerId)
        : [];

    const totalDeduction = selectedAdvances.reduce((sum, id) => {
        const adv = installerAdvances.find(a => a.id === id);
        return sum + (adv ? adv.amount : 0);
    }, 0);

    const finalPayout = selectedSettlement ? selectedSettlement.totalAmount - totalDeduction : 0;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Montażysta</TableHead>
                        <TableHead>Klient / Adres</TableHead>
                        <TableHead>Kwota</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Brak rozliczeń
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {format(new Date(item.createdAt), 'PPP', { locale: pl })}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.installer?.name || item.installer?.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.montage?.clientName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.montage?.installationAddress}, {item.montage?.installationCity}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold">{item.totalAmount.toFixed(2)} PLN</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'paid' ? 'default' : 'secondary'}>
                                        {item.status === 'draft' && 'Szkic'}
                                        {item.status === 'pending' && 'Oczekuje'}
                                        {item.status === 'approved' && 'Zatwierdzone'}
                                        {item.status === 'paid' && 'Wypłacone'}
                                    </Badge>
                                </TableCell>
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
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/crm/montaze/${item.montageId}?tab=settlement`}>
                                                    <ArrowUpRight className="mr-2 h-4 w-4" />
                                                    Zobacz szczegóły
                                                </Link>
                                            </DropdownMenuItem>
                                            {!isHistory && (
                                                <DropdownMenuItem onClick={() => openPaymentDialog(item)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Oznacz jako wypłacone...
                                                </DropdownMenuItem>
                                            )}
                                            {isHistory && (
                                                <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'pending')}>
                                                    Cofnij do oczekujących
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Wypłata wynagrodzenia</DialogTitle>
                        <DialogDescription>
                            Możesz potrącić aktywne zaliczki z kwoty wypłaty.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedSettlement && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <span className="font-medium">Kwota bazowa:</span>
                                <span className="font-bold text-lg">{selectedSettlement.totalAmount.toFixed(2)} PLN</span>
                            </div>

                            {installerAdvances.length > 0 ? (
                                <div className="space-y-3">
                                    <Label>Dostępne zaliczki do potrącenia:</Label>
                                    <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                                        {installerAdvances.map(adv => (
                                            <div key={adv.id} className="flex items-center space-x-3 p-3">
                                                <Checkbox 
                                                    id={`adv-${adv.id}`} 
                                                    checked={selectedAdvances.includes(adv.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedAdvances([...selectedAdvances, adv.id]);
                                                        } else {
                                                            setSelectedAdvances(selectedAdvances.filter(id => id !== adv.id));
                                                        }
                                                    }}
                                                />
                                                <div className="flex-1 text-sm">
                                                    <div className="font-medium">{adv.amount.toFixed(2)} PLN</div>
                                                    <div className="text-muted-foreground text-xs">{format(new Date(adv.requestDate), 'dd.MM.yyyy')} - {adv.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">Brak aktywnych zaliczek dla tego pracownika.</div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="font-medium">Do wypłaty:</span>
                                <span className="font-bold text-xl text-primary">{finalPayout.toFixed(2)} PLN</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Anuluj</Button>
                        <Button onClick={handlePayWithDeductions} disabled={isPending}>
                            {isPending ? 'Przetwarzanie...' : 'Zatwierdź wypłatę'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
