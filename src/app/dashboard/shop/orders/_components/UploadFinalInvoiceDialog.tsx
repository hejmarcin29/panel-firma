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
import { uploadFinalInvoice } from '../actions';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

export function UploadFinalInvoiceDialog({ orderId }: { orderId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await uploadFinalInvoice(orderId, formData);
            toast.success('Faktura wgrana. Zamówienie zakończone.');
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
                <Button size="lg" variant="default" className="w-full md:w-auto bg-green-600 hover:bg-green-700 font-semibold shadow-md">
                    <FileText className="mr-2 h-5 w-5" />
                    Wystaw Fakturę Końcową
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Fakturę Końcową</DialogTitle>
                    <DialogDescription>
                        To ostateczny krok realizacji. Załącz plik PDF faktury (lub paragonu).
                        Status zamówienia zostanie zmieniony na &quot;Zakończone&quot;.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Numer Faktury</Label>
                        <Input
                            id="invoiceNumber"
                            name="invoiceNumber"
                            placeholder="np. FV 150/2026"
                            required
                        />
                         <p className="text-xs text-muted-foreground">Numer wygenerowany w wFirma.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF (Faktura)</Label>
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
                            {isLoading ? 'Wysyłanie...' : 'Zatwierdź i Zakończ'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
