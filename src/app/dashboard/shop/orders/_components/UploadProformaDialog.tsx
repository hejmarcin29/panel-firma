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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mock PDF upload - in real app, uploading to S3/Blob and getting URL
            const mockUrl = `https://storage.example.com/proforma-${orderId}.pdf`;
            
            await uploadProforma(orderId, title, mockUrl);
            toast.success('Proforma wgrana i wysłana');
            setOpen(false);
        } catch (error) {
            toast.error('Wystąpił błąd');
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
                        <Label htmlFor="title">Tytułem przelewu</Label>
                        <Input
                            id="title"
                            placeholder="np. PRO/2026/01/55"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Numer, który klient ma wpisać w tytule przelewu.</p>
                    </div>
                    {/* File input would go here */}
                    <div className="grid gap-2">
                         <Label>Plik PDF</Label>
                         <div className="border border-dashed rounded h-20 flex items-center justify-center text-muted-foreground text-sm cursor-pointer hover:bg-muted/50">
                             Kliknij, aby wybrać plik (Symulacja)
                         </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Zatwierdź i Wyślij</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
