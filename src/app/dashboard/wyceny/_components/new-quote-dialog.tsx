'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createQuote, getMontagesForQuoteSelection } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Montage = {
    id: string;
    clientName: string;
    createdAt: Date;
    status: string;
    displayId: string | null;
    hasQuote: boolean;
};

export function NewQuoteDialog() {
    const [open, setOpen] = useState(false);
    const [montages, setMontages] = useState<Montage[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (open) {
            setLoading(true);
            getMontagesForQuoteSelection()
                .then(setMontages)
                .catch(() => toast.error('Nie udało się pobrać listy montaży'))
                .finally(() => setLoading(false));
        }
    }, [open]);

    const filteredMontages = montages.filter(m => {
        const matchesSearch = m.clientName.toLowerCase().includes(search.toLowerCase()) ||
            (m.displayId && m.displayId.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = showAll || !m.hasQuote;
        return matchesSearch && matchesFilter;
    });

    const handleCreate = async (montageId: string) => {
        try {
            setCreating(true);
            const quoteId = await createQuote(montageId);
            toast.success('Utworzono wycenę');
            setOpen(false);
            router.push(`/dashboard/wyceny/${quoteId}`);
        } catch (error) {
            toast.error('Nie udało się utworzyć wyceny');
            console.error(error);
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nowa Wycena
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Wybierz montaż do wyceny</DialogTitle>
                </DialogHeader>
                
                <div className="flex items-center gap-4 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Szukaj klienta lub numeru..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="show-all"
                            checked={showAll}
                            onCheckedChange={setShowAll}
                        />
                        <Label htmlFor="show-all">Pokaż z wycenami</Label>
                    </div>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredMontages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Brak montaży spełniających kryteria
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredMontages.map((montage) => (
                                <Button
                                    key={montage.id}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-between h-auto py-3 px-4",
                                        montage.hasQuote && "opacity-60"
                                    )}
                                    onClick={() => handleCreate(montage.id)}
                                    disabled={creating}
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-medium">{montage.clientName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {montage.displayId || 'Brak ID'} • {new Date(montage.createdAt).toLocaleDateString('pl-PL')}
                                        </span>
                                    </div>
                                    {montage.hasQuote && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                            Ma wycenę
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
