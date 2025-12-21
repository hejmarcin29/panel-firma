'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calculator, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { calculateSettlement, createSettlement, type SettlementCalculation } from '@/app/dashboard/settlements/actions';
import type { Montage } from '../types';

interface MontageSettlementTabProps {
    montage: Montage;
    userRoles: string[];
}

export function MontageSettlementTab({ montage, userRoles }: MontageSettlementTabProps) {
    const [isPending, startTransition] = useTransition();
    const [isCalculationOpen, setIsCalculationOpen] = useState(false);
    const [calculation, setCalculation] = useState<SettlementCalculation | null>(null);
    const [note, setNote] = useState('');

    const isAdmin = userRoles.includes('admin');
    const isInstaller = userRoles.includes('installer');

    const handleCalculate = () => {
        startTransition(async () => {
            try {
                const result = await calculateSettlement(montage.id);
                setCalculation(result);
                setIsCalculationOpen(true);
            } catch (error) {
                toast.error('Nie udało się przygotować rozliczenia. Sprawdź czy montażysta ma uzupełnione stawki.');
                console.error(error);
            }
        });
    };

    const handleCreate = () => {
        if (!calculation) return;
        
        startTransition(async () => {
            try {
                await createSettlement(montage.id, calculation, note);
                setIsCalculationOpen(false);
                toast.success('Rozliczenie zostało utworzone');
            } catch (error) {
                toast.error('Wystąpił błąd podczas tworzenia rozliczenia');
                console.error(error);
            }
        });
    };

    if (montage.settlement) {
        const { settlement } = montage;
        const calc = settlement.calculations as SettlementCalculation;

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Rozliczenie montażu</CardTitle>
                                <CardDescription>
                                    Utworzono: {settlement.createdAt ? format(new Date(settlement.createdAt), 'PPP', { locale: pl }) : '-'}
                                </CardDescription>
                            </div>
                            <Badge variant={settlement.status === 'paid' ? 'default' : 'secondary'}>
                                {settlement.status === 'draft' && 'Szkic'}
                                {settlement.status === 'pending' && 'Oczekuje'}
                                {settlement.status === 'approved' && 'Zatwierdzone'}
                                {settlement.status === 'paid' && 'Wypłacone'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Podłoga</h4>
                                <div className="flex justify-between text-sm">
                                    <span>Metraż:</span>
                                    <span>{calc.floor.area.toFixed(2)} m²</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Stawka ({calc.floor.pattern === 'herringbone' ? 'Jodełka' : 'Klasycznie'} / {calc.floor.method === 'glue' ? 'Klej' : 'Click'}):</span>
                                    <span>{calc.floor.rate.toFixed(2)} PLN</span>
                                </div>
                                <div className="flex justify-between font-medium pt-2 border-t">
                                    <span>Razem Podłoga:</span>
                                    <span>{calc.floor.amount.toFixed(2)} PLN</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Listwy</h4>
                                <div className="flex justify-between text-sm">
                                    <span>Długość:</span>
                                    <span>{calc.skirting.length.toFixed(2)} mb</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Stawka:</span>
                                    <span>{calc.skirting.rate.toFixed(2)} PLN</span>
                                </div>
                                <div className="flex justify-between font-medium pt-2 border-t">
                                    <span>Razem Listwy:</span>
                                    <span>{calc.skirting.amount.toFixed(2)} PLN</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">Suma całkowita</span>
                            <span className="text-2xl font-bold text-primary">{settlement.totalAmount.toFixed(2)} PLN</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    Brak rozliczenia dla tego montażu. Skontaktuj się z administratorem.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Przygotuj rozliczenie</CardTitle>
                    <CardDescription>
                        System automatycznie wyliczy kwotę na podstawie pomiarów i stawek montażysty.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleCalculate} disabled={isPending} className="w-full md:w-auto">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                        Oblicz wynagrodzenie
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={isCalculationOpen} onOpenChange={setIsCalculationOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Podgląd rozliczenia</DialogTitle>
                        <DialogDescription>
                            Sprawdź wyliczone kwoty przed zatwierdzeniem.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {calculation && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Podłoga ({calculation.floor.area} m² x {calculation.floor.rate} PLN):</span>
                                    <span className="font-medium">{calculation.floor.amount.toFixed(2)} PLN</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-2">
                                    Typ: {calculation.floor.pattern === 'herringbone' ? 'Jodełka' : 'Klasycznie'}, Metoda: {calculation.floor.method === 'glue' ? 'Klej' : 'Click'}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Listwy ({calculation.skirting.length} mb x {calculation.skirting.rate} PLN):</span>
                                    <span className="font-medium">{calculation.skirting.amount.toFixed(2)} PLN</span>
                                </div>
                            </div>

                            <Separator />
                            
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Razem:</span>
                                <span>{calculation.total.toFixed(2)} PLN</span>
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium">Notatka (opcjonalnie)</label>
                                <Textarea 
                                    placeholder="Dodatkowe uwagi do rozliczenia..." 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCalculationOpen(false)}>Anuluj</Button>
                        <Button onClick={handleCreate} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zatwierdź i utwórz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
