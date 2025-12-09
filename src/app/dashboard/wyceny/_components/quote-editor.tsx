'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Wand2, Save } from 'lucide-react';
import { updateQuote } from '../actions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { QuoteItem, QuoteStatus } from '@/lib/db/schema';

type QuoteEditorProps = {
    quote: any; // Type this properly
};

export function QuoteEditor({ quote }: QuoteEditorProps) {
    const router = useRouter();
    const [items, setItems] = useState<QuoteItem[]>(quote.items || []);
    const [status, setStatus] = useState<QuoteStatus>(quote.status);
    const [notes, setNotes] = useState(quote.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    const calculateItemTotal = (item: QuoteItem) => {
        const net = item.quantity * item.priceNet;
        const gross = net * (1 + item.vatRate);
        return { totalNet: net, totalGross: gross };
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        if (['quantity', 'priceNet', 'vatRate'].includes(field)) {
            const { totalNet, totalGross } = calculateItemTotal(newItems[index]);
            newItems[index].totalNet = totalNet;
            newItems[index].totalGross = totalGross;
            newItems[index].priceGross = newItems[index].priceNet * (1 + newItems[index].vatRate);
        }
        
        setItems(newItems);
    };

    const addItem = () => {
        const newItem: QuoteItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            quantity: 1,
            unit: 'szt',
            priceNet: 0,
            vatRate: 0.23,
            priceGross: 0,
            totalNet: 0,
            totalGross: 0,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSmartImport = () => {
        const audit = quote.montage.technicalAudit;
        // Even if audit is missing, we can import basic montage data
        
        const newItems = [...items];
        let importedCount = 0;

        // Import Floor Area
        if (quote.montage.floorArea) {
            newItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: 'Montaż paneli podłogowych',
                quantity: quote.montage.floorArea,
                unit: 'm2',
                priceNet: 25, // Default price
                vatRate: 0.08, // Service VAT
                priceGross: 25 * 1.08,
                totalNet: quote.montage.floorArea * 25,
                totalGross: quote.montage.floorArea * 25 * 1.08,
            });
            importedCount++;
        }

        // Import Skirting
        if (quote.montage.skirtingLength) {
            newItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: 'Montaż listew przypodłogowych',
                quantity: quote.montage.skirtingLength,
                unit: 'mb',
                priceNet: 15,
                vatRate: 0.08,
                priceGross: 15 * 1.08,
                totalNet: quote.montage.skirtingLength * 15,
                totalGross: quote.montage.skirtingLength * 15 * 1.08,
            });
            importedCount++;
        }

        // Check for additional work in audit
        if (audit && audit.subfloorCondition === 'uneven') {
             newItems.push({
                id: Math.random().toString(36).substr(2, 9),
                name: 'Wylewka samopoziomująca (robocizna)',
                quantity: quote.montage.floorArea || 1,
                unit: 'm2',
                priceNet: 30,
                vatRate: 0.08,
                priceGross: 30 * 1.08,
                totalNet: (quote.montage.floorArea || 1) * 30,
                totalGross: (quote.montage.floorArea || 1) * 30 * 1.08,
            });
            importedCount++;
        }

        if (importedCount > 0) {
            setItems(newItems);
            toast.success(`Zaimportowano ${importedCount} pozycji.`);
        } else {
            toast.info('Brak danych do zaimportowania.');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateQuote(quote.id, {
                status,
                items,
                notes,
            });
            toast.success('Wycena zapisana.');
            router.refresh();
        } catch (error) {
            toast.error('Błąd zapisu.');
        } finally {
            setIsSaving(false);
        }
    };

    const totalNet = items.reduce((sum, item) => sum + item.totalNet, 0);
    const totalGross = items.reduce((sum, item) => sum + item.totalGross, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Edytor Wyceny</h2>
                    <p className="text-sm text-muted-foreground">
                        Dla: {quote.montage.clientName} ({quote.montage.installationAddress})
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSmartImport}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Inteligentny Import
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        Zapisz
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Pozycje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Nazwa</TableHead>
                                        <TableHead className="w-[80px]">Ilość</TableHead>
                                        <TableHead className="w-[60px]">J.m.</TableHead>
                                        <TableHead className="w-[100px]">Cena Netto</TableHead>
                                        <TableHead className="w-[80px]">VAT</TableHead>
                                        <TableHead className="w-[120px] text-right">Wartość Brutto</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Input 
                                                    value={item.name} 
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    placeholder="Nazwa usługi/produktu"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={item.unit} 
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.priceNet} 
                                                    onChange={(e) => updateItem(index, 'priceNet', parseFloat(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={item.vatRate.toString()} 
                                                    onValueChange={(v) => updateItem(index, 'vatRate', parseFloat(v))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0.23">23%</SelectItem>
                                                        <SelectItem value="0.08">8%</SelectItem>
                                                        <SelectItem value="0">0%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.totalGross)}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button variant="outline" className="mt-4 w-full" onClick={addItem}>
                            <Plus className="w-4 h-4 mr-2" /> Dodaj pozycję
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Podsumowanie</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Suma Netto:</span>
                                <span className="font-medium">{formatCurrency(totalNet)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Suma Brutto:</span>
                                <span>{formatCurrency(totalGross)}</span>
                            </div>
                            
                            <div className="pt-4 border-t">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Szkic</SelectItem>
                                        <SelectItem value="sent">Wysłana</SelectItem>
                                        <SelectItem value="accepted">Zaakceptowana</SelectItem>
                                        <SelectItem value="rejected">Odrzucona</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notatki</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="Notatki do wyceny..."
                                className="min-h-[150px]"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
