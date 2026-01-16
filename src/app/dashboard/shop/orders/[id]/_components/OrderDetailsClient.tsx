'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    Truck, 
    Printer, 
    CheckCircle, 
    Package, 
    Mail, 
    Phone, 
    MapPin, 
    ArrowLeft,
    CreditCard,
    Building2,
    FileText,
    Archive,
    Link as LinkIcon,
    History,
    Download,
    User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
    generateShippingLabel,
    markAsForwardedToSupplier,
    markAsShippedBySupplier,
    issueFinalInvoice,
    generateOrderMagicLink,
    updateOrderTracking
} from '../actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimelineView, TimelineEvent } from '@/components/shop/timeline-view';
import { UploadProformaDialog } from '../../_components/UploadProformaDialog';
import { UploadFinalInvoiceDialog } from '../../_components/UploadFinalInvoiceDialog';
import { UploadAdvanceInvoiceDialog } from '../../_components/UploadAdvanceInvoiceDialog';
import { UploadCorrectionDialog } from '../../_components/UploadCorrectionDialog';


interface OrderItemDetails {
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
}

interface OrderDetails {
    id: string;
    displayNumber?: string | null;
    status: string;
    type: string; // Added 'type'
    createdAt: Date;
    totalNet: number;
    totalGross: number;
    paymentMethod: string | null;
    shippingCarrier: string | null; // Added
    shippingTrackingNumber: string | null; // Added
    billingAddress: unknown; // Added (JSON)
    shippingAddress: unknown; // Added (JSON)
    customer: {
        name: string;
        email: string | null;
        phone: string | null;
        taxId: string | null;
        billingStreet: string | null;
        billingPostalCode: string | null;
        billingCity: string | null;
        shippingStreet: string | null;
        shippingPostalCode: string | null;
        shippingCity: string | null;
    } | null;
    documents: {
        id: string;
        type: string;
        number: string | null;
        pdfUrl: string | null;
        createdAt: Date;
    }[]; // Added documents
}

interface OrderDetailsClientProps {
    order: OrderDetails; 
    items: OrderItemDetails[];
    timelineEvents: TimelineEvent[];
}

const STATUS_LABELS: Record<string, string> = {
    'order.received': 'Nowe',
    'order.pending_proforma': 'Oczekuje na proformę',
    'order.proforma_issued': 'Wysłano proformę',
    'order.awaiting_payment': 'Oczekuje na wpłatę',
    'order.paid': 'Opłacono - Do realizacji',
    'order.advance_invoice': 'Faktura Zaliczkowa',
    'order.forwarded_to_supplier': 'Zlecono u dostawcy',
    'order.fulfillment_confirmed': 'Wysłano do klienta',
    'order.final_invoice': 'Faktura Końcowa',
    'order.closed': 'Zakończone',
    'order.cancelled': 'Anulowane',
};

// Define flow steps for visualization
const SAMPLE_FLOW = [
    { id: 'order.received', label: 'Nowe' },
    { id: 'order.paid', label: 'Opłacone' },
    { id: 'order.fulfillment_confirmed', label: 'Wysłane' },
    { id: 'order.closed', label: 'Zakończone' }
];

const PANEL_FLOW = [
    { id: 'order.received', label: 'Nowe' },
    { id: 'order.proforma_issued', label: 'Proforma' },
    { id: 'order.paid', label: 'Opłacone' },
    { id: 'order.forwarded_to_supplier', label: 'Zlecono' },
    { id: 'order.fulfillment_confirmed', label: 'Wysłane' },
    { id: 'order.closed', label: 'Faktura Końcowa' }
];

export function OrderDetailsClient({ order, items, timelineEvents }: OrderDetailsClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(order.status);

    // Tracking state
    const [carrier, setCarrier] = useState(order.shippingCarrier || 'other');
    const [trackingNumber, setTrackingNumber] = useState(order.shippingTrackingNumber || '');
    const [isTrackingSaving, setIsTrackingSaving] = useState(false);

    async function handleUpdateTracking() {
        setIsTrackingSaving(true);
        try {
            await updateOrderTracking(order.id, carrier, trackingNumber);
            toast.success('Dane przesyłki zostały zapisane.');
            router.refresh();
        } catch {
            toast.error('Nie udało się zapisać danych przesyłki.');
        } finally {
            setIsTrackingSaving(false);
        }
    }
    
    async function handleCopyMagicLink() {
        try {
            const link = await generateOrderMagicLink(order.id);
            await navigator.clipboard.writeText(link);
            toast.success('Link do statusu skopiowany do schowka!');
            toast.info('Wyślij go klientowi na WhatsApp lub SMS.');
        } catch {
            toast.error('Błąd generowania linku.');
        }
    }

    // Differentiate flows
    const isSampleOrder = order.paymentMethod === 'tpay';
    const currentFlow = isSampleOrder ? SAMPLE_FLOW : PANEL_FLOW;

    // Correct logic for step completion highlighting
    const getStepState = (stepId: string) => {
        const statusIndex = currentFlow.findIndex(s => s.id === status);
        const stepIndex = currentFlow.findIndex(s => s.id === stepId);
        
        if (status === 'order.closed') return 'completed';
        
        if (statusIndex === -1) {
            // If current status is not in main flow diagram (e.g. pending_proforma is a detailed sub-state of received for Panels)
             if (status === 'order.pending_proforma' && stepId === 'order.received') return 'current';
             return 'pending';
        }

        if (stepIndex < statusIndex) return 'completed';
        if (stepIndex === statusIndex) return 'current';
        return 'pending';
    };


    const handleGenerateLabel = async () => {
        setIsLoading(true);
        try {
            const result = await generateShippingLabel(order.id);
            if (result.success) {
                toast.success(`Etykieta wygenerowana. Nr: ${result.trackingNumber}`);
                if (status === 'order.paid' || status === 'order.received') {
                   setStatus('order.fulfillment_confirmed');
                   router.refresh();
                }
            }
        } catch {
            toast.error('Błąd generowania etykiety');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSupplierAction = async (action: 'forward' | 'confirm_ship' | 'invoice') => {
        setIsLoading(true);
        try {
            if (action === 'forward') await markAsForwardedToSupplier(order.id);
            if (action === 'confirm_ship') await markAsShippedBySupplier(order.id);
            if (action === 'invoice') await issueFinalInvoice(order.id);
            
            toast.success('Status zaktualizowany');
            // Optimistic update
            if (action === 'forward') setStatus('order.forwarded_to_supplier');
            if (action === 'confirm_ship') setStatus('order.fulfillment_confirmed');
            if (action === 'invoice') setStatus('order.closed');
            router.refresh();

        } catch {
            toast.error('Wystąpił błąd');
        } finally {
            setIsLoading(false);
        }
    };
    
    
    // --- Render Actions Section ---
    const renderActions = () => {
        if (status === 'order.closed') {
             return (
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center gap-2 border border-emerald-100">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Zamówienie zakończone pomyślnie.</span>
                    </div>
                    <UploadCorrectionDialog orderId={order.id} />
                </div>
             );
        }

        // --- SAMPLE FLOW ACTIONS ---
        if (isSampleOrder) {
            if (status === 'order.paid' || status === 'order.received') {
                return (
                    <Button onClick={handleGenerateLabel} disabled={isLoading} size="lg" className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 font-bold shadow-sm">
                        {isLoading ? 'Generowanie...' : (
                            <>
                                <Printer className="mr-2 h-5 w-5" />
                                Generuj Etykietę InPost
                            </>
                        )}
                    </Button>
                );
            }
             if (status === 'order.fulfillment_confirmed') {
                return (
                     <Button variant="outline" onClick={() => handleSupplierAction('invoice')} disabled={isLoading} className="w-full md:w-auto">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Zakończ (Archiwizuj)
                    </Button>
                )
            }
        } 
        
        // --- PANEL FLOW ACTIONS ---
        else {
            if (status === 'order.pending_proforma') {
                return (
                    <UploadProformaDialog orderId={order.id} />
                );
            }
             if (status === 'order.proforma_issued' || status === 'order.awaiting_payment') {
                 return (
                    <div className="flex items-center gap-2 text-muted-foreground bg-slate-50 px-4 py-2 rounded border">
                        <div className="animate-pulse h-2 w-2 rounded-full bg-amber-500"></div>
                        Oczekiwanie na wpłatę klienta...
                    </div>
                );
            }
            if (status === 'order.paid' || status === 'order.advance_invoice') {
                 return (
                    <div className="flex items-center gap-2">
                         {status === 'order.paid' && (
                             <UploadAdvanceInvoiceDialog orderId={order.id} />
                         )}
                         <Button onClick={() => handleSupplierAction('forward')} disabled={isLoading} size="lg" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 font-semibold shadow-md">
                            {isLoading ? 'Przetwarzanie...' : (
                                <>
                                    <Building2 className="mr-2 h-5 w-5" />
                                    Zleć zamówienie u dostawcy
                                </>
                            )}
                        </Button>
                    </div>
                );
            }
            if (status === 'order.forwarded_to_supplier') {
                 return (
                    <Button onClick={() => handleSupplierAction('confirm_ship')} disabled={isLoading} size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md">
                        {isLoading ? 'Aktualizacja...' : (
                            <>
                                <Truck className="mr-2 h-5 w-5" />
                                Potwierdź wysyłkę od dostawcy
                            </>
                        )}
                    </Button>
                );
            }
            if (status === 'order.fulfillment_confirmed') {
                 return (
                    <div className="flex items-center gap-2">
                         <div className="flex gap-2">
                             <UploadFinalInvoiceDialog orderId={order.id} />
                             <Button onClick={() => handleSupplierAction('invoice')} disabled={isLoading} size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700 font-semibold shadow-md">
                                {isLoading ? 'Generowanie...' : (
                                    <>
                                        <FileText className="mr-2 h-5 w-5" />
                                        Wystaw Fakturę Końcową
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                );
            }
        }
    };


    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount / 100);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Navigation */}
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
                <Link href="/dashboard/shop/orders" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Powrót do listy
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Zamówienie #{order.displayNumber || order.id.slice(0, 8)}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-sm px-3 py-1 font-medium bg-slate-100 text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                         <Badge variant={isSampleOrder ? "outline" : "default"} className={cn("text-sm px-3 py-1 font-medium", !isSampleOrder ? "bg-indigo-500 hover:bg-indigo-600" : "")}>
                            {isSampleOrder ? 'Próbki (Szybka Ścieżka)' : 'Zamówienie (Pełny Proces)'}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                     <Button 
                        variant="outline"
                        onClick={handleCopyMagicLink} 
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                     >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Kopiuj Link
                    </Button>
                    <div className="flex items-center gap-2">
                        {renderActions()}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="details">Panel Operacyjny</TabsTrigger>
                    <TabsTrigger value="history">Oś Czasu i Klient</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">

            {/* Visual Process Timeline (Stepper) */}
            <div className="w-full py-6">
                <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
                    {/* Background Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full" />
                    
                     {/* Colored Line (Progress) - approximate based on completed steps */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-900 -z-10 rounded-full transition-all duration-1000" 
                         style={{ 
                             width: `${(currentFlow.findIndex(s => s.id === status) / (currentFlow.length - 1)) * 100}%` 
                         }} 
                    />

                    {currentFlow.map((step) => {
                        const state = getStepState(step.id);
                        
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    state === 'current' ? "border-slate-900 bg-slate-900 text-white scale-110 shadow-lg ring ring-slate-100" : 
                                    state === 'completed' ? "border-slate-900 bg-white text-slate-900" : "border-slate-200 text-slate-300 bg-white"
                                )}>
                                    {state === 'completed' ? <CheckCircle className="h-5 w-5" /> : 
                                     state === 'current' ? <div className="h-2 w-2 rounded-full bg-white animate-pulse" /> :
                                     <div className="h-2 w-2 rounded-full bg-slate-200" />}
                                </div>
                                <span className={cn(
                                    "text-xs font-semibold uppercase tracking-wide transition-colors",
                                    state === 'current' ? "text-slate-900" : 
                                    state === 'completed' ? "text-slate-700" :
                                    "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>


            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Items & Payment */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Produkty</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center border-b last:border-0 pb-4 last:pb-0 border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                                                <Package className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{item.name}</p>
                                                <p className="text-sm text-slate-500">SKU: {item.sku || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{item.quantity} x {formatPrice(item.unitPrice)}</p>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {formatPrice(item.quantity * item.unitPrice)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-6" />
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Suma Netto</span>
                                <span className="text-slate-700 font-medium">{formatPrice(order.totalNet)}</span>
                            </div>
                             <div className="flex justify-between items-center mt-2 text-lg font-bold">
                                <span>Do zapłaty (Brutto)</span>
                                <span className="text-slate-900">{formatPrice(order.totalGross)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Szczegóły Płatności</CardTitle>
                             {order.status === 'order.paid' || order.status === 'order.fulfillment_confirmed' || order.status === 'order.closed' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Opłacono
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                    Oczekuje na wpłatę
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <CreditCard className="h-6 w-6 text-slate-600" />
                                <div>
                                    <p className="font-medium text-slate-900 capitalize">
                                        {order.paymentMethod === 'tpay' ? 'Płatność Online (Tpay)' : 'Przelew Tradycyjny (Proforma)'}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {isSampleOrder ? 'Płatność automatyczna' : 'Weryfikacja manualna księgowości'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Only for Panel Flow: Supplier Info Placeholder */}
                    {!isSampleOrder && (
                        <Card className="shadow-sm border-slate-200 bg-indigo-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                    Informacje o Dostawie (Logistyka)
                                </CardTitle>
                            </CardHeader>
                             <CardContent>
                                <div className="text-sm text-slate-600">
                                    <p className="mb-2">Ten rodzaj zamówienia jest realizowany poprzez zewnętrznych dostawców lub magazyn centralny.</p>
                                    <ul className="list-disc list-inside space-y-1 text-slate-500">
                                        <li>Dostawca: <strong>Magazyn Główny / Producent</strong></li>
                                        <li>Rodzaj transportu: <strong>Paleta / Spedycja</strong></li>
                                        <li>Status logistyczny: <strong>{STATUS_LABELS[status] || status}</strong></li>
                                    </ul>
                                </div>
                             </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Customer & Shipping */}
                <div className="space-y-6">
                     <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold">Dane Klienta</CardTitle>
                            {order.customer?.taxId ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                    <Building2 className="h-3 w-3" /> Firma
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
                                    <User className="h-3 w-3" /> Osoba prywatna
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-slate-100 p-2 rounded-full">
                                    {order.customer?.taxId ? <Building2 className="h-4 w-4 text-slate-600" /> : <User className="h-4 w-4 text-slate-600" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{order.customer?.name}</p>
                                    {order.customer?.taxId && <p className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">NIP: {order.customer.taxId}</p>}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <a href={`mailto:${order.customer?.email}`} className="text-blue-600 hover:underline">{order.customer?.email}</a>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <a href={`tel:${order.customer?.phone}`} className="text-slate-600 hover:text-slate-900">{order.customer?.phone || '-'}</a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Dokumenty</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(!order.documents || order.documents.length === 0) ? (
                                <div className="text-center text-sm text-muted-foreground py-4">Brak dokumentów</div>
                            ) : (
                                <div className="space-y-3">
                                    {order.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 border rounded text-slate-500">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{doc.number || 'Dokument'}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{doc.type.replace('_', ' ') || doc.type}</p>
                                                </div>
                                            </div>
                                            {doc.pdfUrl ? (
                                                <Button size="icon" variant="ghost" asChild title="Pobierz PDF">
                                                    <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 text-slate-600" />
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Badge variant="outline">Przetwarzanie</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Adres Dostawy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-3 mb-4">
                                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div className="text-sm text-slate-700 leading-relaxed">
                                    <p className="font-medium">{order.customer?.name}</p>
                                    <p>{order.customer?.shippingStreet || order.customer?.billingStreet}</p>
                                    <p>{order.customer?.shippingPostalCode || order.customer?.billingPostalCode} {order.customer?.shippingCity || order.customer?.billingCity}</p>
                                    <p className="text-slate-400">Polska</p>
                                </div>
                            </div>
                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-md text-sm font-medium",
                                isSampleOrder ? "bg-yellow-50 text-yellow-800 border border-yellow-100" : "bg-indigo-50 text-indigo-800 border border-indigo-100"
                            )}>
                                <Truck className="h-4 w-4" />
                                <span>{isSampleOrder ? 'Kurier InPost / Paczkomat' : 'Spedycja Paletowa'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-indigo-600" />
                                Śledzenie Przesyłki
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Przewoźnik</Label>
                                <Select value={carrier} onValueChange={setCarrier}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz przewoźnika" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="geodis">Geodis</SelectItem>
                                        <SelectItem value="fedex">FedEx</SelectItem>
                                        <SelectItem value="dhl">DHL</SelectItem>
                                        <SelectItem value="inpost">InPost</SelectItem>
                                        <SelectItem value="pekaes">Pekaes</SelectItem>
                                        <SelectItem value="raben">Raben</SelectItem>
                                        <SelectItem value="schenker">DB Schenker</SelectItem>
                                        <SelectItem value="other">Inny</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Numer Listu Przewozowego</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Np. 123456789" 
                                        value={trackingNumber} 
                                        onChange={(e) => setTrackingNumber(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <Button 
                                className="w-full" 
                                onClick={handleUpdateTracking} 
                                disabled={isTrackingSaving}
                                variant="outline"
                            >
                                {isTrackingSaving ? 'Zapisywanie...' : 'Zapisz Tracking'}
                            </Button>
                        </CardContent>
                    </Card>

                     <Card className="border-slate-200 bg-slate-50/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sterowanie Manualne</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             {status !== 'order.closed' && (
                                <Button variant="outline" size="sm" className="w-full bg-white hover:bg-slate-50 border-slate-200" onClick={() => router.push(`/dashboard/email?recipient=${order.customer?.email}`)}>
                                    <Mail className="mr-2 h-3 w-3" />
                                    Wyślij Wiadomość
                                </Button>
                             )}
                              <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-slate-600">
                                <Archive className="mr-2 h-3 w-3" />
                                Zmień status manualnie
                             </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            </TabsContent>

            <TabsContent value="history" className="mt-8">
                <div className="grid gap-8 md:grid-cols-3">
                     <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-muted-foreground" />
                                    Pełna Oś Czasu (System + Klient)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TimelineView events={timelineEvents} isAdmin={true} />
                            </CardContent>
                        </Card>
                     </div>
                     <div>
                        <Card className="bg-blue-50/50 border-blue-100">
                             <CardHeader>
                                <CardTitle className="text-blue-700">Widok Klienta</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <p className="text-sm text-slate-600">
                                    Tak widzi to klient po kliknięciu w link.
                                    Możesz skopiować link powyżej i wysłać go ręcznie.
                                </p>
                                <Button className="w-full" variant="outline" onClick={handleCopyMagicLink}>
                                    <LinkIcon className="mr-2 h-4 w-4" /> Kopiuj Link
                                </Button>
                             </CardContent>
                        </Card>
                     </div>
                </div>
            </TabsContent>
            </Tabs>
        </div>
    );
}
