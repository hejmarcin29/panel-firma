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
import { toast } from 'sonner';
import { FileUp, FileText, FileBadge, FileWarning } from 'lucide-react';
import { 
    uploadMontageProforma, 
    uploadMontageFinalInvoice, 
    uploadMontageAdvanceInvoice, 
    uploadMontageCorrectionInvoice 
} from '../document-actions';

export function UploadMontageProformaDialog({ montageId }: { montageId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await uploadMontageProforma(montageId, formData);
            toast.success('Proforma wgrana');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Błąd podczas wysyłania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Wgraj Proformę
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Proformę</DialogTitle>
                    <DialogDescription>
                        Dla klienta. Wymagany numer z wFirmy.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="proformaNumber">Numer Proformy</Label>
                        <Input
                            id="proformaNumber"
                            name="proformaNumber"
                            placeholder="np. PRO 10/2026"
                            required
                        />
                         <p className="text-xs text-muted-foreground">Numer wygenerowany w wFirma.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF</Label>
                         <Input id="file" name="file" type="file" accept="application/pdf" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Wysyłanie...' : 'Zapisz'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function UploadMontageFinalInvoiceDialog({ montageId }: { montageId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await uploadMontageFinalInvoice(montageId, formData);
            toast.success('Faktura wgrana');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Błąd podczas wysyłania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    Faktura Końcowa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Fakturę Końcową</DialogTitle>
                    <DialogDescription>z wFirmy.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Numer Faktury</Label>
                        <Input
                            id="invoiceNumber"
                            name="invoiceNumber"
                            placeholder="np. FV 15/2026"
                            required
                        />
                         <p className="text-xs text-muted-foreground">Numer wygenerowany w wFirma.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF</Label>
                         <Input id="file" name="file" type="file" accept="application/pdf" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Wysyłanie...' : 'Zapisz'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function UploadMontageAdvanceInvoiceDialog({ montageId }: { montageId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await uploadMontageAdvanceInvoice(montageId, formData);
            toast.success('Zaliczka wgrana');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Błąd podczas wysyłania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <FileBadge className="mr-2 h-4 w-4" />
                    Faktura Zaliczkowa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Zaliczkę</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Numer Faktury</Label>
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
                         <Input id="file" name="file" type="file" accept="application/pdf" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Wysyłanie...' : 'Zapisz'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function UploadMontageCorrectionDialog({ montageId }: { montageId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await uploadMontageCorrectionInvoice(montageId, formData);
            toast.success('Korekta wgrana');
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Błąd podczas wysyłania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                    <FileWarning className="mr-2 h-4 w-4" />
                    Korekta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Wgraj Korektę</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Numer Korekty</Label>
                        <Input
                            id="invoiceNumber"
                            name="invoiceNumber"
                            placeholder="np. KOR 1/2026"
                            required
                        />
                         <p className="text-xs text-muted-foreground">Numer wygenerowany w wFirma.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="file">Plik PDF</Label>
                         <Input id="file" name="file" type="file" accept="application/pdf" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Wysyłanie...' : 'Zapisz'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
