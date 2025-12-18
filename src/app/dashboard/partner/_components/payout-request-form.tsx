'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPayout } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

interface PayoutRequestFormProps {
    maxAmount: number;
}

export function PayoutRequestForm({ maxAmount }: PayoutRequestFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || !file) {
            toast.error('Wypełnij wszystkie pola');
            return;
        }

        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            toast.error('Nieprawidłowa kwota');
            return;
        }

        if (amountValue > maxAmount) {
            toast.error('Kwota przewyższa dostępne środki');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('amount', amountValue.toString());
        formData.append('invoice', file);

        try {
            const result = await requestPayout(formData);
            if (result.success) {
                toast.success('Zlecenie wypłaty zostało wysłane');
                setOpen(false);
                setAmount('');
                setFile(null);
                router.refresh();
            } else {
                toast.error(result.error || 'Wystąpił błąd');
            }
        } catch (error) {
            toast.error('Wystąpił błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">Wypłać środki</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Zlecenie wypłaty</DialogTitle>
                    <DialogDescription>
                        Wprowadź kwotę i załącz fakturę/rachunek.
                        Dostępne środki: {formatCurrency(maxAmount)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Kwota wypłaty (PLN)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={maxAmount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="invoice">Faktura / Rachunek (PDF, JPG)</Label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="invoice-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Kliknij, aby dodać</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {file ? file.name : 'PDF, PNG, JPG (max. 5MB)'}
                                    </p>
                                </div>
                                <input
                                    id="invoice-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    required
                                />
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Wysyłanie...' : 'Zleć wypłatę'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
