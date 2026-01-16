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
import { uploadProforma } from '../actions';
import { toast } from 'sonner';
import { FileUp } from 'lucide-react';

export function UploadProformaDialog({ orderId }: { orderId: string }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Manual validation for 'title' is not needed if we use FormData directly, 
        // but 'uploadProforma' signature expects (id, title, formData) as per my update?
        // Let's check actions.ts signature.
        // export async function uploadProforma(orderId: string, transferTitle: string, formData: FormData)
        
        try {
            await uploadProforma(orderId, title, formData);
            toast.success('Proforma wgrana i wysłana');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Wystąpił błąd podczas wysyłania');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="default">
                    <FileUp className="mr-2 h-4 w-4" />
                    Wgraj Proformę
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Proformę</DialogTitle>
                    <DialogDescription>
                        Załącz plik PDF wygenerowany w programie księgowym.
                        Klient otrzyma go mailem.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Numer Proformy (Tytułem przelewu)</Label>
                        <Input
                            id="title"
                            placeholder="np. PRO/2026/01/55"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Numer proformy wygenerowany w wFirma.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF (Proforma)</Label>
                         <Input 
                            id="file" 
                            name="file" 
                            type="file" 
                            accept="application/pdf"
                            required
                         />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Zatwierdź i Wyślij</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
