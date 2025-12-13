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
import { Trash2, Plus, Wand2, Save, Printer, Mail, MoreHorizontal, ArrowLeft, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { QuoteItem, QuoteStatus } from '@/lib/db/schema';
import type { TechnicalAuditData } from '@/app/dashboard/montaze/technical-data';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateQuote, sendQuoteEmail, getProductsForQuote, deleteQuote } from '../actions';

type ProductAttribute = {
    id: number;
    name: string;
    slug: string;
    options: string[];
};

type Product = {
    id: number;
    name: string;
    price: string | null;
    attributes: unknown;
};

function getProductAttribute(product: Product, slug: string): ProductAttribute | undefined {
    const attributes = product.attributes as ProductAttribute[];
    if (!Array.isArray(attributes)) return undefined;
    return attributes.find((a) => a.slug === slug);
}

type QuoteEditorProps = {
    quote: {
        id: string;
        items: QuoteItem[];
        status: QuoteStatus;
        notes: string | null;
        montage: {
            id: string;
            clientName: string;
            installationAddress: string | null;
            floorArea: number | null;
            skirtingLength: number | null;
            panelModel: string | null;
            panelProductId?: number | null;
            skirtingModel: string | null;
            skirtingProductId?: number | null;
            panelWaste: number | null;
            skirtingWaste: number | null;
            technicalAudit: unknown;
        };
    };
};

export function QuoteEditor({ quote }: QuoteEditorProps) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [items, setItems] = useState<QuoteItem[]>(quote.items || []);
    const [status, setStatus] = useState<QuoteStatus>(quote.status);
    const [notes, setNotes] = useState(quote.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter products based on montage models
    const filteredProducts = availableProducts.filter(product => {
        // Check IDs first
        if (quote.montage.panelProductId === product.id) return true;
        if (quote.montage.skirtingProductId === product.id) return true;

        const searchTerms = [
            quote.montage.panelModel,
            quote.montage.skirtingModel
        ].filter(Boolean).map(t => t?.toLowerCase());

        if (searchTerms.length === 0) return true; // Show all if no models specified

        const productName = product.name.toLowerCase();
        return searchTerms.some(term => term && productName.includes(term));
    });

    // If we have filtered results, use them. Otherwise show all (fallback)
    const productsDisplay = filteredProducts.length > 0 ? filteredProducts : availableProducts;

    const calculateItemTotal = (item: QuoteItem) => {
        const net = item.quantity * item.priceNet;
        const gross = net * (1 + item.vatRate);
        return { totalNet: net, totalGross: gross };
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
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
            vatRate: 0.08,
            priceGross: 0,
            totalNet: 0,
            totalGross: 0,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSmartImport = async () => {
        setIsImporting(true);
        try {
            const products = await getProductsForQuote();
            setAvailableProducts(products);
            setImportDialogOpen(true);
        } catch {
            toast.error('Nie udało się pobrać produktów');
        } finally {
            setIsImporting(false);
        }
    };

    const executeSmartImport = (selectedProduct?: Product) => {
        const audit = quote.montage.technicalAudit as TechnicalAuditData | null;
        const newItems = [...items];
        let importedCount = 0;

        // Import Floor Area (Service)
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

        // Import Selected Product (Material)
        if (selectedProduct) {
            const attributes = selectedProduct.attributes as ProductAttribute[];
            // Check if it's a skirting board (has length attribute)
            const lengthAttr = attributes?.find((a) => a.slug === 'pa_dlugosc');
            
            if (lengthAttr && quote.montage.skirtingLength) {
                // SKIRTING BOARD LOGIC
                const quantityMb = quote.montage.skirtingLength;
                
                // Add waste (from montage settings or default 5%)
                const wastePercent = quote.montage.skirtingWaste ?? 5;
                const quantityMbWithWaste = quantityMb * (1 + wastePercent / 100);
                
                // Parse length from attribute (e.g. "2.4 metra")
                const lengthStr = lengthAttr.options?.[0] || '0';
                const lengthPerPiece = parseFloat(lengthStr.replace(',', '.').replace(/[^0-9.]/g, ''));
                
                if (!isNaN(lengthPerPiece) && lengthPerPiece > 0) {
                    const piecesNeeded = Math.ceil(quantityMbWithWaste / lengthPerPiece);
                    const notes = `(Zapotrzebowanie: ${quantityMbWithWaste.toFixed(2)} mb [zapas ${wastePercent}%], ${piecesNeeded} szt. po ${lengthPerPiece} mb)`;
                    
                    const priceNet = parseFloat(selectedProduct.price || '0');

                    newItems.push({
                        id: Math.random().toString(36).substr(2, 9),
                        productId: selectedProduct.id,
                        name: selectedProduct.name + ` ${notes}`,
                        quantity: piecesNeeded,
                        unit: 'szt',
                        priceNet: priceNet,
                        vatRate: 0.08,
                        priceGross: priceNet * 1.08,
                        totalNet: piecesNeeded * priceNet,
                        totalGross: piecesNeeded * priceNet * 1.08,
                    });
                    importedCount++;
                }
            } else if (quote.montage.floorArea) {
                // PANEL LOGIC (Default)
                const attributes = selectedProduct.attributes as ProductAttribute[];
                let quantity = quote.montage.floorArea;
                const unit = 'm2';
                let notes = '';

                // Add waste (from montage settings or default 5%)
                const wastePercent = quote.montage.panelWaste ?? 5;
                const quantityWithWaste = quantity * (1 + wastePercent / 100);
                
                // Check for package quantity attribute
                const packageAttr = attributes?.find((a) => a.slug === 'pa_ilosc_opakowanie');
                
                // Recalculate packages with waste
                if (packageAttr && packageAttr.options && packageAttr.options.length > 0) {
                    const packageSize = parseFloat(packageAttr.options[0].replace(',', '.'));
                    if (!isNaN(packageSize) && packageSize > 0) {
                        const packagesNeeded = Math.ceil(quantityWithWaste / packageSize);
                        quantity = packagesNeeded * packageSize;
                        notes = `(Pełne opakowania: ${packagesNeeded} op. po ${packageSize} m2 [zapas ${wastePercent}%])`;
                    } else {
                        quantity = quantityWithWaste;
                    }
                } else {
                    quantity = quantityWithWaste;
                }

                const priceNet = parseFloat(selectedProduct.price || '0');
                
                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    productId: selectedProduct.id,
                    name: selectedProduct.name + (notes ? ` ${notes}` : ''),
                    quantity: Number(quantity.toFixed(2)),
                    unit: unit,
                    priceNet: priceNet,
                    vatRate: 0.08, // Material VAT
                    priceGross: priceNet * 1.08,
                    totalNet: quantity * priceNet,
                    totalGross: quantity * priceNet * 1.08,
                });
                importedCount++;
            }
        }

        // Import Skirting (Service)
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
        if (audit && audit.flatness === 'leveling') {
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
        setImportDialogOpen(false);
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
        } catch {
            toast.error('Błąd zapisu.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        setIsSending(true);
        try {
            await sendQuoteEmail(quote.id);
            toast.success('Wysłano wycenę na email klienta');
            setStatus('sent');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Błąd wysyłania emaila');
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteQuote(quote.id);
            toast.success('Wycena została usunięta');
            router.push('/dashboard/wyceny');
        } catch {
            toast.error('Nie udało się usunąć wyceny');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const totalNet = items.reduce((sum, item) => sum + item.totalNet, 0);
    const totalGross = items.reduce((sum, item) => sum + item.totalGross, 0);

    if (isMobile) {
        return (
            <div className="space-y-4 pb-24">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="-ml-2">
                            <Link href="/dashboard/wyceny">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="font-semibold text-sm">{quote.montage.clientName}</h2>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {quote.montage.installationAddress}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" /> Drukuj / PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSendEmail} disabled={isSending}>
                                <Mail className="w-4 h-4 mr-2" /> Wyślij Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSmartImport}>
                                <Wand2 className="w-4 h-4 mr-2" /> Importuj z pomiaru
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive" 
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Usuń wycenę
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <Card key={item.id} className="overflow-hidden border-l-4 border-l-primary/20">
                            <CardContent className="p-3 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <Input 
                                        value={item.name} 
                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                        placeholder="Nazwa usługi/produktu"
                                        className="font-medium h-9 text-sm"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeItem(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Ilość</Label>
                                        <Input 
                                            type="number" 
                                            value={item.quantity} 
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Jedn.</Label>
                                        <Input 
                                            value={item.unit} 
                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">VAT</Label>
                                        <Select 
                                            value={item.vatRate.toString()} 
                                            onValueChange={(v) => updateItem(index, 'vatRate', parseFloat(v))}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.08">8%</SelectItem>
                                                <SelectItem value="0.23">23%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Cena Netto</Label>
                                        <Input 
                                            type="number" 
                                            value={item.priceNet} 
                                            onChange={(e) => updateItem(index, 'priceNet', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Wartość Brutto</Label>
                                        <div className="h-8 flex items-center justify-end font-semibold text-sm">
                                            {formatCurrency(item.totalGross)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    <Button variant="outline" className="w-full border-dashed h-12" onClick={addItem}>
                        <Plus className="w-4 h-4 mr-2" /> Dodaj pozycję
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Suma Netto:</span>
                                <span>{formatCurrency(totalNet)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold">
                                <span>Suma Brutto:</span>
                                <span className="text-primary">{formatCurrency(totalGross)}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v: QuoteStatus) => setStatus(v)}>
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

                        <div className="space-y-2">
                            <Label>Notatki</Label>
                            <Textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="Notatki..."
                                className="min-h-[80px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 flex gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <Button className="w-full h-12 text-base font-semibold shadow-lg" onClick={handleSave} disabled={isSaving}>
                        <Save className="w-5 h-5 mr-2" />
                        {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </Button>
                </div>

                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Inteligentny Import z Pomiaru</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-1 border rounded-md p-2">
                            <div className="space-y-2">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start font-normal"
                                    onClick={() => executeSmartImport(undefined)}
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold">Importuj tylko usługi</span>
                                        <span className="text-xs text-muted-foreground">
                                            Dodaje montaż paneli ({quote.montage.floorArea} m²)
                                        </span>
                                    </div>
                                </Button>
                                
                                {productsDisplay.map((product) => (
                                    <Button
                                        key={product.id}
                                        variant="ghost"
                                        className="w-full justify-start font-normal h-auto py-3"
                                        onClick={() => executeSmartImport(product)}
                                    >
                                        <div className="flex flex-col items-start text-left w-full">
                                            <span className="font-semibold truncate w-full">{product.name}</span>
                                            <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                                                <span>Cena: {product.price} zł</span>
                                                {quote.montage.panelProductId === product.id && (
                                                    <span className="text-primary font-medium">Wybrany w pomiarze (Panele)</span>
                                                )}
                                                {quote.montage.skirtingProductId === product.id && (
                                                    <span className="text-primary font-medium">Wybrany w pomiarze (Listwy)</span>
                                                )}
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Czy na pewno chcesz usunąć tę wycenę?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tej operacji nie można cofnąć. Wycena zostanie trwale usunięta z systemu.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeleting ? 'Usuwanie...' : 'Usuń'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body * { visibility: hidden; }
                    .quote-print-area, .quote-print-area * { visibility: visible; }
                    .quote-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .print-full-width { width: 100% !important; max-width: none !important; }
                    .print-border-none { border: none !important; box-shadow: none !important; }
                }
            `}</style>

            <div className="flex items-center justify-between no-print">
                <div>
                    <h2 className="text-lg font-semibold">Edytor Wyceny</h2>
                    <p className="text-sm text-muted-foreground">
                        Dla: {quote.montage.clientName} ({quote.montage.installationAddress})
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Drukuj / PDF
                    </Button>
                    <Button variant="outline" onClick={handleSendEmail} disabled={isSending}>
                        <Mail className="w-4 h-4 mr-2" />
                        {isSending ? 'Wysyłanie...' : 'Wyślij Email'}
                    </Button>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 quote-print-area">
                <Card className="lg:col-span-2 print-full-width print-border-none">
                    <CardHeader className="print:hidden flex flex-row items-center justify-between">
                        <CardTitle>Pozycje</CardTitle>
                        <div className="flex gap-2">
                            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={handleSmartImport} disabled={isImporting}>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Inteligentny Import
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>Inteligentny Import z Pomiaru</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="flex-1 border rounded-md p-2">
                                        <div className="space-y-2">
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start font-normal"
                                                onClick={() => executeSmartImport(undefined)}
                                            >
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="font-medium">Tylko usługi (bez materiału)</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Importuje tylko montaż i listwy na podstawie pomiaru
                                                    </span>
                                                </div>
                                            </Button>
                                            {productsDisplay.map((product) => (
                                                <Button
                                                    key={product.id}
                                                    variant="ghost"
                                                    className="w-full justify-start h-auto py-3"
                                                    onClick={() => executeSmartImport(product)}
                                                >
                                                    <div className="flex flex-col items-start text-left w-full">
                                                        <div className="flex justify-between w-full">
                                                            <span className="font-medium">{product.name}</span>
                                                            <span className="font-mono text-sm">{product.price} zł</span>
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            {getProductAttribute(product, 'pa_ilosc_opakowanie') && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                    Paczka: {getProductAttribute(product, 'pa_ilosc_opakowanie')?.options[0]} m²
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                            <Button onClick={addItem} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Dodaj pozycję
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        <div className="print:mb-8 hidden print:block">
                            <h1 className="text-2xl font-bold mb-2">Wycena #{quote.id.slice(0, 8)}</h1>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="font-semibold text-gray-500 text-sm uppercase mb-1">Sprzedawca</h3>
                                    <p>Twoja Firma Sp. z o.o.</p>
                                    <p>ul. Przykładowa 123</p>
                                    <p>00-000 Warszawa</p>
                                    <p>NIP: 123-456-78-90</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-semibold text-gray-500 text-sm uppercase mb-1">Nabywca</h3>
                                    <p>{quote.montage.clientName}</p>
                                    <p>{quote.montage.installationAddress}</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Nazwa</TableHead>
                                        <TableHead className="w-20 text-right">Ilość</TableHead>
                                        <TableHead className="w-[60px]">J.m.</TableHead>
                                        <TableHead className="w-[100px] text-right">Cena Netto</TableHead>
                                        <TableHead className="w-20 text-right">VAT</TableHead>
                                        <TableHead className="w-[120px] text-right">Wartość Brutto</TableHead>
                                        <TableHead className="w-[50px] no-print"></TableHead>
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
                                                    className="print:border-none print:p-0 print:h-auto"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                    className="text-right print:border-none print:p-0 print:h-auto"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={item.unit} 
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                    className="print:border-none print:p-0 print:h-auto"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.priceNet} 
                                                    onChange={(e) => updateItem(index, 'priceNet', parseFloat(e.target.value))}
                                                    className="text-right print:border-none print:p-0 print:h-auto"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={item.vatRate.toString()} 
                                                    onValueChange={(v) => updateItem(index, 'vatRate', parseFloat(v))}
                                                >
                                                    <SelectTrigger className="print:border-none print:p-0 print:h-auto print:justify-end">
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
                                            <TableCell className="no-print">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button variant="outline" className="mt-4 w-full no-print" onClick={addItem}>
                            <Plus className="w-4 h-4 mr-2" /> Dodaj pozycję
                        </Button>

                        <div className="mt-8 flex justify-end print:mt-4">
                            <div className="w-1/2 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Suma Netto:</span>
                                    <span className="font-medium">{formatCurrency(totalNet)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Suma Brutto:</span>
                                    <span>{formatCurrency(totalGross)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6 print:hidden">
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
                                <Select value={status} onValueChange={(v: QuoteStatus) => setStatus(v)}>
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

                {/* Print-only notes section */}
                <div className="hidden print:block mt-8 pt-8 border-t">
                    <h3 className="font-bold mb-2">Uwagi:</h3>
                    <p className="whitespace-pre-wrap text-sm">{notes}</p>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć tę wycenę?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Wycena zostanie trwale usunięta z systemu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Usuwanie...' : 'Usuń'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
