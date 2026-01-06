'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Trash2, Plus, Wand2, Save, Printer, Mail, MoreHorizontal, ArrowLeft, 
    CheckCircle2, Clock, FileText, LayoutTemplate, Calculator, AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { QuoteItem, QuoteStatus } from '@/lib/db/schema';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
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
import { updateQuote, sendQuoteEmail, getProductsForQuote, deleteQuote, getSmartImportItems } from '../actions';
import { FileText as FileTextIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const QuotePdfWrapper = dynamic(() => import('./quote-pdf-wrapper'), {
  ssr: false,
  loading: () => <Button variant="outline" size="sm" disabled>Ładowanie PDF...</Button>,
});

type Product = {
    id: string;
    name: string;
    price: string | null;
    attributes: {
        id: string;
        name: string;
        slug: string | null;
        options: string[];
    }[];
};

type QuoteEditorProps = {
    quote: {
        id: string;
        number: string | null;
        createdAt: string;
        items: QuoteItem[];
        status: QuoteStatus;
        notes: string | null;
        totalNet: number;
        totalGross: number;
        montage: {
            id: string;
            clientName: string;
            installationAddress: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            floorArea: number | null;
            panelModel: string | null;
            panelProductId?: string | null;
            panelWaste: number | null;
            technicalAudit: unknown;
            measurementAdditionalMaterials?: unknown;
            address: string | null;
            serviceItems?: {
                id: string;
                quantity: number;
                clientPrice: number;
                vatRate: number | null;
                snapshotName: string | null;
                service: {
                    name: string;
                    unit: string;
                }
            }[];
        };
        termsContent?: string | null;
        signatureData?: string | null;
        signedAt?: Date | null;
    };
    templates: Array<{ id: string; name: string; content: string }>;
    companyInfo: {
        name: string;
        address: string;
        nip: string;
        logoUrl?: string;
    };
};

export function QuoteEditor({ quote, templates, companyInfo }: QuoteEditorProps) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [items, setItems] = useState<QuoteItem[]>(quote.items || []);
    const [status, setStatus] = useState<QuoteStatus>(quote.status);
    const [notes, setNotes] = useState(quote.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // Terms selection
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [termsContent, setTermsContent] = useState<string>(quote.termsContent || '');

    const [isImporting, setIsImporting] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load initial template if terms are empty
    useEffect(() => {
        if (!quote.termsContent && templates.length > 0 && !termsContent) {
             // Optional: Auto-load default template?
             // For now, we let the user choose.
        }
    }, [quote.termsContent, templates, termsContent]);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setTermsContent(template.content);
            toast.success(`Załadowano szablon: ${template.name}`);
        }
    };

    // Filter products based on montage models
    const filteredProducts = availableProducts.filter(product => {
        if (quote.montage.panelProductId === product.id) return true;

        const searchTerms = [
            quote.montage.panelModel,
        ].filter(Boolean).map(t => t?.toLowerCase());

        if (searchTerms.length === 0) return true;

        const productName = product.name.toLowerCase();
        return searchTerms.some(term => term && productName.includes(term));
    });

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

    const executeSmartImport = async (selectedProduct?: Product) => {
        setIsImporting(true);
        try {
            const result = await getSmartImportItems(quote.montage.id, selectedProduct);
            
            if (!result.success || !result.items) {
                toast.error(result.error || 'Nie udało się zaimportować pozycji');
                return;
            }

            const newItems = [...items, ...result.items];
            setItems(newItems);
            
            if (result.items.length > 0) {
                toast.success(`Zaimportowano ${result.items.length} pozycji z pomiaru`);
            } else {
                toast.info('Brak pozycji do zaimportowania z pomiaru');
            }
            
            setImportDialogOpen(false);
        } catch (error) {
            console.error('Smart import error:', error);
            toast.error('Wystąpił błąd podczas importu');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateQuote(quote.id, {
                status,
                items,
                notes,
                termsContent,
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
            router.push('/dashboard/crm/oferty');
        } catch {
            toast.error('Nie udało się usunąć wyceny');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const totalNet = items.reduce((sum, item) => sum + item.totalNet, 0);
    const totalGross = items.reduce((sum, item) => sum + item.totalGross, 0);

    const currentQuote = {
        ...quote,
        items,
        status,
        notes,
        termsContent,
        totalNet,
        totalGross,
    };

    const getStatusColor = (s: QuoteStatus) => {
        switch (s) {
            case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (s: QuoteStatus) => {
        switch (s) {
            case 'draft': return 'Szkic';
            case 'sent': return 'Wysłana';
            case 'accepted': return 'Zaakceptowana';
            case 'rejected': return 'Odrzucona';
            default: return s;
        }
    };

    // --- MOBILE VIEW ---
    if (isMobile) {
        return (
            <div className="space-y-4 pb-48">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="-ml-2">
                            <Link href="/dashboard/crm/oferty">
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
                            <DropdownMenuItem asChild>
                                <div className="w-full">
                                    <QuotePdfWrapper 
                                        quote={currentQuote} 
                                        companyInfo={companyInfo}
                                        render={(loading) => (
                                            <div className="flex items-center w-full cursor-pointer">
                                                <FileTextIcon className="w-4 h-4 mr-2" />
                                                {loading ? 'Generowanie...' : 'Pobierz PDF'}
                                            </div>
                                        )}
                                    />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" /> Drukuj
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
                                <Trash2 className="w-4 h-4 mr-2" /> Usuń ofertę
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
                            <Label>Warunki (Edycja uproszczona)</Label>
                            <RichTextEditor 
                                value={termsContent} 
                                onChange={setTermsContent} 
                                placeholder="Wpisz warunki..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 p-4 bg-background border-t z-40 flex gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <Button className="w-full h-12 text-base font-semibold shadow-lg" onClick={handleSave} disabled={isSaving}>
                        <Save className="w-5 h-5 mr-2" />
                        {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </Button>
                </div>
                
                {/* Mobile Dialogs */}
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

    // --- DESKTOP VIEW ---
    return (
        <div className="min-h-screen bg-muted/30">
            <style jsx global>{`
                @media print {
                    @page { margin: 1.5cm; }
                    body * { visibility: hidden; }
                    .quote-print-area, .quote-print-area * { visibility: visible; }
                    .quote-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .print-full-width { width: 100% !important; max-width: none !important; }
                    .print-border-none { border: none !important; box-shadow: none !important; }
                    .print-text-black { color: black !important; }
                }
            `}</style>

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-6 py-3 flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/crm/oferty">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">
                                Oferta {quote.number || `#${quote.id.slice(0, 8)}`}
                            </h1>
                            <Badge variant="outline" className={cn("capitalize", getStatusColor(status))}>
                                {getStatusLabel(status)}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {quote.montage.clientName} 
                            <span className="text-muted-foreground/50">•</span> 
                            {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="mr-4 text-right hidden xl:block">
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Wartość Brutto</div>
                        <div className="text-lg font-bold text-primary">{formatCurrency(totalGross)}</div>
                    </div>
                    <Separator orientation="vertical" className="h-8 mr-2 hidden xl:block" />
                    
                    <Button variant="outline" onClick={handleSmartImport} disabled={isImporting}>
                        <Wand2 className="w-4 h-4 mr-2 text-purple-600" />
                        Import z Pomiaru
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreHorizontal className="w-4 h-4 mr-2" />
                                Więcej
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" /> Drukuj
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSendEmail} disabled={isSending}>
                                <Mail className="w-4 h-4 mr-2" /> Wyślij Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive" 
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Usuń ofertę
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <QuotePdfWrapper 
                        quote={currentQuote} 
                        companyInfo={companyInfo}
                        render={(loading) => (
                            <Button variant="outline" disabled={loading}>
                                <FileTextIcon className="w-4 h-4 mr-2" />
                                {loading ? 'Generowanie...' : 'PDF'}
                            </Button>
                        )}
                    />

                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 p-6 max-w-[1600px] mx-auto">
                
                {/* Left Column: The Document */}
                <div className="space-y-6 quote-print-area">
                    <Card className="shadow-sm border-border/60 print-border-none">
                        <CardContent className="p-8 min-h-[800px] print:p-0">
                            
                            {/* Document Header */}
                            <div className="flex justify-between items-start mb-12 print:mb-8">
                                <div>
                                    <div className="text-2xl font-bold text-primary mb-2">{companyInfo.name}</div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>{companyInfo.address}</p>
                                        <p>NIP: {companyInfo.nip}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">Nabywca</div>
                                    <div className="font-medium text-lg">{quote.montage.clientName}</div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>{quote.montage.installationAddress}</p>
                                        <p>{quote.montage.contactEmail}</p>
                                        <p>{quote.montage.contactPhone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
                                    Pozycje Oferty
                                </h2>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[40%]">Nazwa / Opis</TableHead>
                                                <TableHead className="text-right w-[10%]">Ilość</TableHead>
                                                <TableHead className="w-[10%]">J.m.</TableHead>
                                                <TableHead className="text-right w-[15%]">Cena Netto</TableHead>
                                                <TableHead className="text-right w-[10%]">VAT</TableHead>
                                                <TableHead className="text-right w-[15%]">Wartość</TableHead>
                                                <TableHead className="w-[50px] no-print"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={item.id} className="group">
                                                    <TableCell className="align-top">
                                                        <Textarea 
                                                            value={item.name} 
                                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                            placeholder="Nazwa usługi/produktu"
                                                            className="min-h-10 resize-none border-transparent focus:border-input bg-transparent px-0 py-1 font-medium"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <Input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                            className="text-right border-transparent focus:border-input bg-transparent px-0 h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <Input 
                                                            value={item.unit} 
                                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                            className="border-transparent focus:border-input bg-transparent px-0 h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <Input 
                                                            type="number" 
                                                            value={item.priceNet} 
                                                            onChange={(e) => updateItem(index, 'priceNet', parseFloat(e.target.value))}
                                                            className="text-right border-transparent focus:border-input bg-transparent px-0 h-9 font-mono"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-top text-right">
                                                        <Select 
                                                            value={item.vatRate.toString()} 
                                                            onValueChange={(v) => updateItem(index, 'vatRate', parseFloat(v))}
                                                        >
                                                            <SelectTrigger className="border-transparent focus:border-input bg-transparent px-0 h-9 justify-end">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="0.23">23%</SelectItem>
                                                                <SelectItem value="0.08">8%</SelectItem>
                                                                <SelectItem value="0">0%</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="align-top text-right font-medium font-mono pt-3">
                                                        {formatCurrency(item.totalGross)}
                                                    </TableCell>
                                                    <TableCell className="align-top no-print">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {items.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                        Brak pozycji. Kliknij &quot;Dodaj pozycję&quot; lub użyj importu.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-2 no-print">
                                    <Button variant="ghost" size="sm" onClick={addItem} className="text-muted-foreground hover:text-primary">
                                        <Plus className="w-4 h-4 mr-2" /> Dodaj wiersz
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end mb-12">
                                <div className="w-1/2 lg:w-1/3 space-y-3">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Suma Netto</span>
                                        <span>{formatCurrency(totalNet)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Podatek VAT</span>
                                        <span>{formatCurrency(totalGross - totalNet)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-xl font-bold text-primary">
                                        <span>Do zapłaty</span>
                                        <span>{formatCurrency(totalGross)}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-8" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between no-print">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        Warunki Umowy
                                    </h2>
                                    <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                        <SelectTrigger className="w-[250px]">
                                            <SelectValue placeholder="Wybierz szablon..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates?.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="min-h-[300px] border rounded-md p-1">
                                    <RichTextEditor 
                                        value={termsContent} 
                                        onChange={setTermsContent} 
                                        placeholder="Tutaj wpisz treść umowy lub wybierz szablon..."
                                    />
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Controls & Summary */}
                <div className="space-y-6 no-print">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-primary" />
                                Podsumowanie
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Status Oferty</Label>
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
                                <Label>Status Podpisu</Label>
                                {quote.signedAt ? (
                                    <div className="flex items-center gap-3 p-3 rounded-md border bg-green-50/50 border-green-200 text-green-700">
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <div>
                                            <div className="font-medium text-sm">Podpisana</div>
                                            <div className="text-xs opacity-80">
                                                {new Date(quote.signedAt).toLocaleDateString('pl-PL')}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 rounded-md border bg-orange-50/50 border-orange-200 text-orange-700">
                                        <Clock className="w-5 h-5 shrink-0" />
                                        <div>
                                            <div className="font-medium text-sm">Oczekuje na podpis</div>
                                            <div className="text-xs opacity-80">Klient nie podpisał jeszcze oferty</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Notatki Wewnętrzne</CardTitle>
                            <CardDescription>Widoczne tylko dla pracowników</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="Wpisz notatki..."
                                className="min-h-[150px] resize-none"
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/20">
                        <CardHeader>
                            <CardTitle className="text-base text-destructive flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Strefa Niebezpieczna
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                variant="destructive" 
                                className="w-full" 
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Usuń Ofertę
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Inteligentny Import z Pomiaru</DialogTitle>
                        <DialogDescription>
                            Wybierz produkt, aby automatycznie obliczyć zapotrzebowanie na podstawie wymiarów z pomiaru.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 border rounded-md p-2 mt-4">
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start font-normal p-4 h-auto hover:bg-accent/50"
                                onClick={() => executeSmartImport(undefined)}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-semibold text-primary">Tylko Usługi (Bez materiału)</span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                        Dodaje pozycje montażu paneli i listew na podstawie metrażu ({quote.montage.floorArea} m²).
                                    </span>
                                </div>
                            </Button>
                            
                            <Separator className="my-2" />
                            
                            {productsDisplay.map((product) => (
                                <Button
                                    key={product.id}
                                    variant="ghost"
                                    className="w-full justify-start font-normal h-auto p-4 hover:bg-accent/50"
                                    onClick={() => executeSmartImport(product)}
                                >
                                    <div className="flex flex-col items-start text-left w-full">
                                        <div className="flex justify-between w-full items-center">
                                            <span className="font-semibold">{product.name}</span>
                                            <Badge variant="secondary">{product.price} zł</Badge>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {quote.montage.panelProductId === product.id && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Wybrany w pomiarze (Panele)
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Anuluj</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć tę ofertę?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Oferta zostanie trwale usunięta z systemu.
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
