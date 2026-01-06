'use client';

import { useState, useEffect } from 'react';
import { getBrokenMontages, fixMontageStatus } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Lista statusów ręcznie skopiowana lub importowana, dla UI wystarczy uproszczona
// W idealnym świecie importowalibyśmy to z shared, ale tu zróbmy to bezpiecznie
const TARGET_STATUSES = [
    { value: 'new_lead', label: 'Nowe Zgłoszenie' },
    { value: 'contact_attempt', label: 'Do umówienia' },
    { value: 'measurement_scheduled', label: 'Pomiar Umówiony' },
    { value: 'quote_in_progress', label: 'Wycena w toku' },
    { value: 'quote_sent', label: 'Oferta wysłana' },
    { value: 'contract_signed', label: 'Umowa podpisana' },
    { value: 'installation_scheduled', label: 'Montaż zaplanowany' },
    { value: 'completed', label: 'Zakończone' },
];

export default function FixingPage() {
    const [loading, setLoading] = useState(true);
    const [montages, setMontages] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getBrokenMontages();
            setMontages(data);
        } catch (error) {
            toast.error('Błąd ładowania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleFix = async (id: string, newStatus: string) => {
        try {
            await fixMontageStatus(id, newStatus);
            toast.success('Naprawiono status');
            // Usuń z listy lokalnie
            setMontages(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            toast.error('Błąd zapisu');
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Naprawa Statusów (Rescue View)</h1>
                <p className="text-muted-foreground">
                    Poniższe montaże posiadają status, który nie istnieje już w nowym procesie (np. ze starej wersji systemu).
                    Przypisz im poprawny, aktualny etap, aby przywrócić je na listy.
                </p>
            </div>

            {montages.length === 0 ? (
                <Card className="bg-green-50/50 border-green-200">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            <CardTitle>Czysto!</CardTitle>
                        </div>
                        <CardDescription>
                            Nie znaleziono żadnych montaży z nieprawidłowym statusem.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Znaleziono {montages.length} problematycznych montaży</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Klient</TableHead>
                                    <TableHead>Adres</TableHead>
                                    <TableHead>Obecny (Zły) Status</TableHead>
                                    <TableHead>Data utworzenia</TableHead>
                                    <TableHead>Akcja naprawcza</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {montages.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">
                                            {m.clientName}
                                            {m.customer && <div className="text-xs text-muted-foreground">{m.customer.email}</div>}
                                        </TableCell>
                                        <TableCell>
                                            {m.installationCity || m.city || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="destructive" className="font-mono">
                                                {m.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(m.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Select onValueChange={(val) => handleFix(m.id, val)}>
                                                <SelectTrigger className="w-[250px]">
                                                    <SelectValue placeholder="Wybierz nowy status..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TARGET_STATUSES.map(s => (
                                                        <SelectItem key={s.value} value={s.value}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
