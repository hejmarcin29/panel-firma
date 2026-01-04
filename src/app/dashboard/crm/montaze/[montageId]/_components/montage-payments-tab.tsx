'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, CheckCircle2, Trash2, Upload, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { createPayment, markPaymentAsPaid, deletePayment } from '../actions';
import { FileUpload } from '@/components/ui/file-upload';
import { useUpload } from '@/hooks/use-upload';
import { Badge } from '@/components/ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Payment {
    id: string;
    name: string;
    amount: string;
    status: 'pending' | 'paid';
    invoiceNumber: string;
    proformaUrl: string | null;
    invoiceUrl: string | null;
    paidAt: Date | null;
    createdAt: Date;
    type: 'advance' | 'final' | 'other';
}

interface MontagePaymentsTabProps {
    montageId: string;
    payments: Payment[];
}

export function MontagePaymentsTab({ montageId, payments }: MontagePaymentsTabProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { upload } = useUpload();

    // Add Payment Form State
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
    const [newType, setNewType] = useState<'advance' | 'final' | 'other'>('other');
    const [newProformaFile, setNewProformaFile] = useState<File | null>(null);

    // Mark Paid Form State
    const [finalInvoiceFile, setFinalInvoiceFile] = useState<File | null>(null);

    const handleAddPayment = async () => {
        if (!newName || !newAmount || !newInvoiceNumber) {
            toast.error('Wypełnij wszystkie wymagane pola');
            return;
        }

        setIsSubmitting(true);
        try {
            let proformaUrl = undefined;
            if (newProformaFile) {
                proformaUrl = await upload(newProformaFile, montageId, 'documents');
            }

            await createPayment(montageId, {
                name: newName,
                amount: parseFloat(newAmount),
                invoiceNumber: newInvoiceNumber,
                proformaUrl,
                type: newType,
            });

            toast.success('Płatność dodana');
            setIsAddOpen(false);
            setNewName('');
            setNewAmount('');
            setNewInvoiceNumber('');
            setNewType('other');
            setNewProformaFile(null);
        } catch (error) {
            console.error(error);
            toast.error('Błąd podczas dodawania płatności');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsPaid = async (paymentId: string) => {
        setIsSubmitting(true);
        try {
            let invoiceUrl = undefined;
            if (finalInvoiceFile) {
                invoiceUrl = await upload(finalInvoiceFile, montageId, 'documents');
            }

            await markPaymentAsPaid(paymentId, { invoiceUrl });
            toast.success('Płatność oznaczona jako opłacona');
            setIsMarkPaidOpen(null);
            setFinalInvoiceFile(null);
        } catch (error) {
            console.error(error);
            toast.error('Błąd podczas aktualizacji płatności');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (paymentId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tę płatność?')) return;
        
        try {
            await deletePayment(paymentId);
            toast.success('Płatność usunięta');
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Płatności Klienta</h3>
                    <p className="text-sm text-muted-foreground">
                        Zarządzaj wpłatami od klienta (zaliczki, raty, końcowe rozliczenie).
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Dodaj Płatność
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nowa Płatność</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Typ płatności</Label>
                                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz typ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="advance">Zaliczka</SelectItem>
                                        <SelectItem value="final">Końcowa</SelectItem>
                                        <SelectItem value="other">Inna</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Nazwa płatności</Label>
                                <Input 
                                    placeholder="np. Zaliczka na materiały" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kwota (PLN)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00" 
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Numer Proformy / Tytuł przelewu</Label>
                                <Input 
                                    placeholder="np. PRO/2025/01/001" 
                                    value={newInvoiceNumber}
                                    onChange={(e) => setNewInvoiceNumber(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Ten numer klient zobaczy jako wymagany tytuł przelewu.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Plik Proformy (PDF)</Label>
                                <Input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => setNewProformaFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Anuluj</Button>
                            <Button onClick={handleAddPayment} disabled={isSubmitting}>
                                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Kwota</TableHead>
                                <TableHead>Tytuł Przelewu</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Dokumenty</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Brak płatności. Dodaj pierwszą (np. zaliczkę).
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                            <div>{payment.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {payment.type === 'advance' && 'Zaliczka'}
                                                {payment.type === 'final' && 'Końcowa'}
                                                {payment.type === 'other' && 'Inna'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(parseFloat(payment.amount))}</TableCell>
                                        <TableCell className="font-mono text-xs">{payment.invoiceNumber}</TableCell>
                                        <TableCell>
                                            {payment.status === 'paid' ? (
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                    Opłacona
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                                    Oczekuje
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {payment.proformaUrl && (
                                                    <a href={payment.proformaUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-blue-600 hover:underline">
                                                        <FileText className="w-3 h-3 mr-1" /> Proforma
                                                    </a>
                                                )}
                                                {payment.invoiceUrl && (
                                                    <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-green-600 hover:underline">
                                                        <FileText className="w-3 h-3 mr-1" /> Faktura
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {payment.status === 'pending' && (
                                                    <Dialog open={isMarkPaidOpen === payment.id} onOpenChange={(open) => setIsMarkPaidOpen(open ? payment.id : null)}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                                Oznacz jako opłacone
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Potwierdź wpłatę</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <p>Czy na pewno chcesz oznaczyć płatność <strong>{payment.name}</strong> ({formatCurrency(parseFloat(payment.amount))}) jako opłaconą?</p>
                                                                
                                                                <div className="space-y-2">
                                                                    <Label>Wgraj Fakturę Zaliczkową/Końcową (Opcjonalnie)</Label>
                                                                    <Input 
                                                                        type="file" 
                                                                        accept=".pdf"
                                                                        onChange={(e) => setFinalInvoiceFile(e.target.files?.[0] || null)}
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Jeśli wgrasz plik, zastąpi on proformę w widoku klienta (lub pojawi się obok).
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={() => setIsMarkPaidOpen(null)}>Anuluj</Button>
                                                                <Button onClick={() => handleMarkAsPaid(payment.id)} disabled={isSubmitting}>
                                                                    {isSubmitting ? 'Zapisywanie...' : 'Potwierdź wpłatę'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(payment.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
