'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink, RefreshCw, Copy } from 'lucide-react';
import { revokeMagicLink, revokeAllMagicLinks, type MagicLinkItem } from './actions';

interface MagicLinksManagerProps {
    links: MagicLinkItem[];
}

export function MagicLinksManager({ links }: MagicLinksManagerProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [isRevokingAll, setIsRevokingAll] = useState(false);

    const handleRevoke = (id: string, type: 'montage' | 'customer') => {
        startTransition(async () => {
            try {
                await revokeMagicLink(id, type);
                toast.success('Link został unieważniony');
                router.refresh();
            } catch (error) {
                toast.error('Błąd podczas usuwania linku');
                console.error(error);
            }
        });
    };

    const handleRevokeAll = async () => {
        setIsRevokingAll(true);
        try {
            await revokeAllMagicLinks();
            toast.success('Wszystkie linki zostały unieważnione');
            router.refresh();
        } catch (error) {
            toast.error('Błąd podczas usuwania linków');
            console.error(error);
        } finally {
            setIsRevokingAll(false);
        }
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Aktywne linki ({links.length})</h3>
                    <p className="text-sm text-muted-foreground">
                        Lista wszystkich aktywnych linków dostępowych (starych /s/ i nowych /montaz/).
                    </p>
                </div>
                
                {links.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Unieważnij wszystkie ({links.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Czy na pewno chcesz usunąć wszystkie linki?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta operacja spowoduje, że wszyscy klienci stracą dostęp do swoich portali. 
                                    Będą musieli otrzymać nowe linki. Tej operacji nie można cofnąć.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleRevokeAll}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isRevokingAll ? 'Usuwanie...' : 'Tak, usuń wszystkie'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Typ</TableHead>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Kontekst / Adres</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {links.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Brak aktywnych linków dostępowych
                                </TableCell>
                            </TableRow>
                        ) : (
                            links.map((link) => (
                                <TableRow key={`${link.type}-${link.id}`}>
                                    <TableCell>
                                        <Badge variant={link.type === 'montage' ? 'default' : 'secondary'}>
                                            {link.type === 'montage' ? 'Montaż (/montaz/)' : 'Klient (/s/)'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{link.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {link.context}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {link.url}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${origin}${link.url}`);
                                                    toast.success('Skopiowano');
                                                }}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost" 
                                                size="icon"
                                                asChild
                                            >
                                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={pending}
                                                onClick={() => handleRevoke(link.id, link.type)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
