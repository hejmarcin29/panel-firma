'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { uploadAdvanceInvoice } from '../actions';
import { toast } from 'sonner';
import { FileBadge } from 'lucide-react';

export function UploadAdvanceInvoiceDialog({ orderId }: { orderId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await uploadAdvanceInvoice(orderId, formData);
            toast.success('Faktura zaliczkowa wgrana.');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Wystąpił błąd podczas wysyłania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <FileBadge className="mr-2 h-4 w-4" />
                    Wgraj Zaliczkę
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Fakturę Zaliczkową</DialogTitle>
                    <DialogDescription>
                        Dla zamówień opłaconych, po zaksięgowaniu wpłaty.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Numer Faktury Zaliczkowej</Label>
                        <Input
                            id="invoiceNumber"
                            name="invoiceNumber"
                            placeholder="np. FZ 10/2026"
                            required
                        />
                         <p className="text-xs text-muted-foreground">Numer wygenerowany w wFirma.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF</Label>
                         <Input 
                            id="file" 
                            name="file" 
                            type="file" 
                            accept="application/pdf"
                            required
                         />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Wysyłanie...' : 'Zatwierdź'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
