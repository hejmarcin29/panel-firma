'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calculator, Loader2, Edit2, Plus, Trash2, Info, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { calculateSettlement, saveSettlement, updateSettlementStatus, type SettlementCalculation } from '@/app/dashboard/settlements/actions';
import type { Montage } from '../types';

interface MontageSettlementTabProps {
    montage: Montage;
    userRoles: string[];
}

export function MontageSettlementTab({ montage, userRoles }: MontageSettlementTabProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // State for the settlement data
    const [calculation, setCalculation] = useState<SettlementCalculation | null>(null);
    const [note, setNote] = useState('');
    
    // UI States
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);
    const [overrideAmount, setOverrideAmount] = useState<string>('');
    const [overrideReason, setOverrideReason] = useState('');
    
    const [newCorrectionDesc, setNewCorrectionDesc] = useState('');
    const [newCorrectionAmount, setNewCorrectionAmount] = useState('');

    const isAdmin = userRoles.includes('admin');
    
    const settlement = montage.settlement;
    const isReadOnly = Boolean(settlement && (settlement.status === 'paid' || (settlement.status === 'approved' && !isAdmin)));

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (settlement) {
                // Load existing settlement
                const savedCalc = settlement.calculations as SettlementCalculation;
                setCalculation(savedCalc);
                setNote(settlement.note || '');
                
                // Check for updates if draft
                if (settlement.status === 'draft') {
                    try {
                        const freshCalc = await calculateSettlement(montage.id);
                        // Update system total in case rates changed, but keep user edits
                        setCalculation(prev => prev ? {
                            ...prev,
                            floor: freshCalc.floor, // Update floor details
                            services: freshCalc.services,
                            materials: freshCalc.materials,
                            systemTotal: freshCalc.total, // Update system total
                        } : freshCalc);
                    } catch (e) {
                        console.error("Failed to refresh calculation", e);
                    }
                }
            } else {
                // Calculate fresh
                try {
                    const result = await calculateSettlement(montage.id);
                    setCalculation(result);
                } catch (error) {
                    console.error(error);
                    toast.error('Nie udało się pobrać stawek. Skontaktuj się z administratorem.');
                }
            }
        };
        loadData();
    }, [montage.id, settlement]);

    const handleSave = (asDraft: boolean) => {
        if (!calculation) return;
        
        startTransition(async () => {
            try {
                await saveSettlement(montage.id, calculation, note, asDraft);
                toast.success(asDraft ? 'Zapisano szkic' : 'Wysłano do akceptacji');
                router.refresh();
            } catch (error) {
                toast.error('Wystąpił błąd podczas zapisywania');
                console.error(error);
            }
        });
    };

    const handleApprove = () => {
        if (!settlement) return;
        startTransition(async () => {
            try {
                await updateSettlementStatus(settlement.id, 'approved');
                toast.success('Rozliczenie zatwierdzone');
                router.refresh();
            } catch {
                toast.error('Błąd podczas zatwierdzania');
            }
        });
    };

    const handleReject = () => {
        if (!settlement) return;
        startTransition(async () => {
            try {
                await updateSettlementStatus(settlement.id, 'draft'); // Revert to draft
                toast.success('Rozliczenie odrzucone (przywrócono do szkicu)');
                router.refresh();
            } catch {
                toast.error('Błąd podczas odrzucania');
            }
        });
    };

    const addCorrection = () => {
        if (!newCorrectionDesc || !newCorrectionAmount || !calculation) return;
        const amount = parseFloat(newCorrectionAmount);
        if (isNaN(amount)) return;

        const newCorrection = {
            id: Math.random().toString(36).substr(2, 9),
            description: newCorrectionDesc,
            amount: amount
        };

        setCalculation({
            ...calculation,
            corrections: [...(calculation.corrections || []), newCorrection],
            total: calculation.total + amount
        });

        setNewCorrectionDesc('');
        setNewCorrectionAmount('');
    };

    const removeCorrection = (id: string) => {
        if (!calculation) return;
        const correction = calculation.corrections.find(c => c.id === id);
        if (!correction) return;

        setCalculation({
            ...calculation,
            corrections: calculation.corrections.filter(c => c.id !== id),
            total: calculation.total - correction.amount
        });
    };

    const applyOverride = () => {
        if (!calculation || !overrideAmount || !overrideReason) return;
        const amount = parseFloat(overrideAmount);
        if (isNaN(amount)) return;

        // Recalculate total: (Override OR Floor) + Services + Materials + Corrections
        const correctionsTotal = calculation.corrections?.reduce((sum, c) => sum + c.amount, 0) || 0;
        const servicesTotal = calculation.services?.reduce((sum, s) => sum + s.amount, 0) || 0;
        const materialsTotal = calculation.materials?.reduce((sum, m) => sum + m.amount, 0) || 0;
        
        setCalculation({
            ...calculation,
            override: {
                amount: amount,
                reason: overrideReason
            },
            total: amount + servicesTotal + materialsTotal + correctionsTotal
        });
        setIsOverrideOpen(false);
    };

    const removeOverride = () => {
        if (!calculation) return;
        const correctionsTotal = calculation.corrections?.reduce((sum, c) => sum + c.amount, 0) || 0;
        const servicesTotal = calculation.services?.reduce((sum, s) => sum + s.amount, 0) || 0;
        const materialsTotal = calculation.materials?.reduce((sum, m) => sum + m.amount, 0) || 0;
        
        setCalculation({
            ...calculation,
            override: undefined,
            total: calculation.floor.amount + servicesTotal + materialsTotal + correctionsTotal
        });
    };

    if (!calculation) {
        return (
            <Card>
                <CardContent className="pt-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const baseAmount = calculation.override ? calculation.override.amount : calculation.floor.amount;
    const servicesTotal = calculation.services?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const materialsTotal = calculation.materials?.reduce((sum, m) => sum + m.amount, 0) || 0;
    const correctionsTotal = calculation.corrections?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const totalAmount = baseAmount + servicesTotal + materialsTotal + correctionsTotal;

    return (
        <div className="space-y-6">
            {/* Header Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Rozliczenie Montażu</h3>
                    <p className="text-sm text-muted-foreground">
                        {settlement?.updatedAt ? `Ostatnia aktualizacja: ${format(new Date(settlement.updatedAt), 'PPP', { locale: pl })}` : 'Nowe rozliczenie'}
                    </p>
                </div>
                {settlement && (
                    <Badge variant={settlement.status === 'paid' ? 'default' : 'secondary'} 
                    className={`text-base px-4 py-1 self-start sm:self-auto ${
                        settlement.status === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                        settlement.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''
                    }`}>
                        {settlement.status === 'draft' && 'Szkic'}
                        {settlement.status === 'pending' && 'Oczekuje na akceptację'}
                        {settlement.status === 'approved' && 'Zatwierdzone'}
                        {settlement.status === 'paid' && 'Wypłacone'}
                    </Badge>
                )}
            </div>

            {/* Missing Rate Warning */}
            {calculation.floor.rate === 0 && !calculation.override && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Brak stawki montażysty!</AlertTitle>
                    <AlertDescription>
                        System nie znalazł stawki dla tego montażysty i policzył 0 PLN. 
                        Uzupełnij stawkę w Ustawieniach lub użyj opcji &quot;Edytuj bazę&quot;, aby wpisać kwotę ręcznie.
                    </AlertDescription>
                </Alert>
            )}

            {/* Base Calculation Section */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Usługa Bazowa
                        </CardTitle>
                        {!isReadOnly && (
                            <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Edytuj bazę
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edycja kwoty bazowej</DialogTitle>
                                        <DialogDescription>
                                            Zmień kwotę bazową tylko jeśli wyliczenie systemowe jest błędne.
                                            Wymagane podanie powodu.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Wyliczenie systemowe</Label>
                                            <div className="text-lg font-bold text-muted-foreground">
                                                {calculation.floor.amount.toFixed(2)} PLN
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nowa kwota (PLN)</Label>
                                            <Input 
                                                type="number" 
                                                value={overrideAmount} 
                                                onChange={(e) => setOverrideAmount(e.target.value)}
                                                placeholder="np. 1800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Powód zmiany</Label>
                                            <Textarea 
                                                value={overrideReason} 
                                                onChange={(e) => setOverrideReason(e.target.value)}
                                                placeholder="np. Klient zrezygnował z jednego pokoju..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsOverrideOpen(false)}>Anuluj</Button>
                                        <Button onClick={applyOverride} disabled={!overrideAmount || !overrideReason}>Zapisz zmianę</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="space-y-1">
                            <div className="font-medium">
                                {calculation.floor.pattern === 'herringbone' ? 'Jodełka' : 'Deska'} ({calculation.floor.method === 'glue' ? 'Klej' : 'Klik'})
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {calculation.floor.area.toFixed(2)} m² x {calculation.floor.rate.toFixed(2)} PLN (Netto)
                            </div>
                        </div>
                        <div className="text-right">
                            {calculation.override ? (
                                <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground line-through decoration-red-500">
                                        {calculation.floor.amount.toFixed(2)} PLN
                                    </div>
                                    <div className="font-bold text-lg flex items-center gap-2 justify-end text-amber-600">
                                        {calculation.override.amount.toFixed(2)} PLN
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Powód: {calculation.override.reason}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    {!isReadOnly && (
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-500" onClick={removeOverride}>
                                            Przywróć systemową
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="font-bold text-lg">
                                    {calculation.floor.amount.toFixed(2)} PLN
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Services Section */}
            {calculation.services && calculation.services.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Usługi Dodatkowe
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {calculation.services.map(service => (
                                <div key={service.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{service.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {service.quantity} x {service.rate.toFixed(2)} PLN
                                        </div>
                                    </div>
                                    <div className="font-bold">
                                        {service.amount.toFixed(2)} PLN
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Additional Materials Section */}
            {calculation.materials && calculation.materials.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Materiały Montażysty
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {calculation.materials.map(material => (
                                <div key={material.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{material.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {material.quantity} x {material.cost.toFixed(2)} PLN
                                        </div>
                                    </div>
                                    <div className="font-bold">
                                        {material.amount.toFixed(2)} PLN
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Corrections Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Korekty i Dodatki</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {calculation.corrections && calculation.corrections.length > 0 ? (
                        <div className="space-y-2">
                            {calculation.corrections.map((correction) => (
                                <div key={correction.id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                                    <span className="text-sm">{correction.description}</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-medium ${correction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {correction.amount > 0 ? '+' : ''}{correction.amount.toFixed(2)} PLN
                                        </span>
                                        {!isReadOnly && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => removeCorrection(correction.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-2">Brak dodatkowych korekt</div>
                    )}

                    {!isReadOnly && (
                        <div className="flex gap-2 items-end pt-2">
                            <div className="grid gap-1.5 flex-1">
                                <Label htmlFor="desc" className="text-xs">Opis</Label>
                                <Input 
                                    id="desc" 
                                    placeholder="np. Wniesienie paczek, Montaż listew..." 
                                    value={newCorrectionDesc}
                                    onChange={(e) => setNewCorrectionDesc(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5 w-32">
                                <Label htmlFor="amount" className="text-xs">Kwota (PLN)</Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={newCorrectionAmount}
                                    onChange={(e) => setNewCorrectionAmount(e.target.value)}
                                />
                            </div>
                            <Button variant="secondary" onClick={addCorrection} disabled={!newCorrectionDesc || !newCorrectionAmount}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary & Actions */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-medium">Do wypłaty</span>
                        <span className="text-3xl font-bold text-primary">{totalAmount.toFixed(2)} PLN</span>
                    </div>

                    <div className="space-y-2 mb-6">
                        <Label>Notatka do rozliczenia</Label>
                        <Textarea 
                            placeholder="Dodatkowe informacje..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isReadOnly}
                            className="bg-white"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        {!isReadOnly && (
                            <>
                                <Button variant="outline" onClick={() => handleSave(true)} disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Zapisz szkic
                                </Button>
                                <Button onClick={() => handleSave(false)} disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isAdmin ? 'Zatwierdź i Zapisz' : 'Wyślij do akceptacji'}
                                </Button>
                            </>
                        )}
                        
                        {isAdmin && settlement && settlement.status === 'pending' && (
                            <>
                                <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                                    Odrzuć
                                </Button>
                                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isPending}>
                                    Zatwierdź
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
