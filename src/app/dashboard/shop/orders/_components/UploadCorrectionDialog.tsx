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
import { uploadCorrectionInvoice } from '../actions';
import { toast } from 'sonner';
import { FileWarning } from 'lucide-react';

export function UploadCorrectionDialog({ orderId }: { orderId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await uploadCorrectionInvoice(orderId, formData);
            toast.success('Korekta została wgrana.');
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
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <FileWarning className="mr-2 h-4 w-4" />
                    Dodaj Korektę
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Fakturę Korygującą</DialogTitle>
                    <DialogDescription>
                        Użyj tej opcji w przypadku zwrotów lub błędów na fakturze.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF (Korekta)</Label>
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
