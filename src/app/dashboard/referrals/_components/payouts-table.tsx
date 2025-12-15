'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { completePayoutRequest, rejectPayoutRequest } from '../actions';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Customer {
    name: string | null;
    email: string;
}

interface PayoutRequest {
    id: string;
    createdAt: Date;
    amount: number;
    rewardType: string;
    status: string;
    note: string | null;
    customer: Customer;
}

interface PayoutsTableProps {
    requests: PayoutRequest[];
}

export function PayoutsTable({ requests }: PayoutsTableProps) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleComplete = async (id: string, note: string) => {
        try {
            setIsProcessing(id);
            await completePayoutRequest(id, note);
            toast.success('Wypłata zrealizowana');
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Wystąpił nieznany błąd');
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Czy na pewno chcesz odrzucić tę wypłatę? Środki wrócą do klienta.')) return;
        try {
            setIsProcessing(id);
            await rejectPayoutRequest(id);
            toast.success('Wypłata odrzucona');
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Wystąpił nieznany błąd');
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount / 100);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Klient</TableHead>
                        <TableHead>Kwota</TableHead>
                        <TableHead>Nagroda</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notatka</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell>{new Date(request.createdAt).toLocaleDateString('pl-PL')}</TableCell>
                            <TableCell>
                                <div>{request.customer.name}</div>
                                <div className="text-xs text-muted-foreground">{request.customer.email}</div>
                            </TableCell>
                            <TableCell className="font-bold">{formatCurrency(request.amount)}</TableCell>
                            <TableCell className="capitalize">{request.rewardType}</TableCell>
                            <TableCell>
                                <Badge variant={
                                    request.status === 'completed' ? 'default' : 
                                    request.status === 'rejected' ? 'destructive' : 'secondary'
                                }>
                                    {request.status === 'completed' ? 'Zrealizowano' : 
                                     request.status === 'rejected' ? 'Odrzucono' : 'Oczekuje'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{request.note || '-'}</TableCell>
                            <TableCell className="text-right">
                                {request.status === 'pending' && (
                                    <div className="flex justify-end gap-2">
                                        <CompleteDialog id={request.id} onComplete={handleComplete} isProcessing={isProcessing === request.id} />
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleReject(request.id)}
                                            disabled={isProcessing === request.id}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {requests.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                Brak zleceń wypłaty.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function CompleteDialog({ id, onComplete, isProcessing }: { id: string, onComplete: (id: string, note: string) => void, isProcessing: boolean }) {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState('');

    const handleSubmit = () => {
        onComplete(id, note);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Check className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Zrealizuj wypłatę</DialogTitle>
                    <DialogDescription>
                        Wprowadź kod vouchera lub notatkę dla klienta.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="note">Kod / Notatka</Label>
                        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="np. Kod Allegro: XYZ-123" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isProcessing}>Zatwierdź</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
