'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createManualReview } from '../actions';

interface Product {
    id: string;
    name: string;
}

interface ReviewFormProps {
    products: Product[];
}

export function ReviewForm({ products }: ReviewFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        try {
            const data = {
                productId: formData.get('productId'),
                rating: formData.get('rating'),
                content: formData.get('content'),
                authorName: formData.get('authorName'),
                createdAt: formData.get('createdAt'),
            };

            await createManualReview(data);
            toast.success('Opinia dodana pomyślnie');
            setOpen(false);
        } catch {
            toast.error('Błąd podczas dodawania opinii');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Dodaj Opinię Ręcznie
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dodaj Opinię</DialogTitle>
                    <DialogDescription>
                        Wprowadź opinię ręcznie (np. z SMS lub e-maila od klienta).
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="productId">Produkt</Label>
                        <Select name="productId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz produkt" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="authorName">Klient</Label>
                        <Input id="authorName" name="authorName" placeholder="np. Jan Kowalski" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="rating">Ocena (Gwiazdki)</Label>
                        <Select name="rating" defaultValue="5" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz ocenę" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">⭐⭐⭐⭐⭐ (5/5)</SelectItem>
                                <SelectItem value="4">⭐⭐⭐⭐ (4/5)</SelectItem>
                                <SelectItem value="3">⭐⭐⭐ (3/5)</SelectItem>
                                <SelectItem value="2">⭐⭐ (2/5)</SelectItem>
                                <SelectItem value="1">⭐ (1/5)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Treść Opinii</Label>
                        <Textarea id="content" name="content" placeholder="Wpisz treść opinii..." required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="createdAt">Data (Opcjonalnie)</Label>
                        <Input id="createdAt" name="createdAt" type="date" />
                        <p className="text-xs text-muted-foreground">Pozostaw puste dla dzisiejszej daty.</p>
                    </div>

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Zapisywanie...' : 'Zapisz Opinię'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
