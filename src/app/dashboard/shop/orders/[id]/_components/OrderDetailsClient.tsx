'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    Send,
    Archive
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
    updateShopOrderStatus, 
    generateShippingLabel,
    markAsForwardedToSupplier,
    markAsShippedBySupplier,
    issueFinalInvoice
} from '../actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface OrderDetailsClientProps {
    order: any; 
    items: any[];
}

const STATUS_LABELS: Record<string, string> = {
    'order.received': 'Nowe',
    'order.pending_proforma': 'Oczekuje na proformę',
    'order.proforma_issued': 'Wysłano proformę',
    'order.awaiting_payment': 'Oczekuje na wpłatę',
    'order.paid': 'Opłacono - Do realizacji',
    'order.forwarded_to_supplier': 'Zlecono u dostawcy',
    'order.fulfillment_confirmed': 'Wysłano do klienta',
    'order.closed': 'Zakończone',
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

export function OrderDetailsClient({ order, items }: OrderDetailsClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(order.status);

    // Differentiate flows
    const isSampleOrder = order.paymentMethod === 'tpay';
    const currentFlow = isSampleOrder ? SAMPLE_FLOW : PANEL_FLOW;

    // Helper to check if step is completed
    const isStepCompleted = (stepId: string) => {
        const statusIndex = currentFlow.findIndex(s => s.id === status);
        const stepIndex = currentFlow.findIndex(s => s.id === stepId);
        // Special case: if status is closed, everything is completed
        if (status === 'order.closed') return true;
        // Special case: if status is not in flow (e.g. pending_proforma which is before proforma_issued), handle carefully
        if (statusIndex === -1) {
            // Check specific mappings for pre-steps
             if (status === 'order.pending_proforma' && stepId === 'order.received') return true;
             return false;
        }
        return stepIndex >= stepIndex; // Logic fix: check relative position
    };
    
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
        } catch (error) {
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
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center gap-2 border border-emerald-100">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Zamówienie zakończone pomyślnie.</span>
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
                    // This button actually triggers the dialog in the parent list, but here we can just show info or link back
                    // For now let's assume user uses the "Send Proforma" dialog or manual update
                     <Button disabled variant="secondary" className="w-full md:w-auto opacity-50 cursor-not-allowed">
                        <FileText className="mr-2 h-4 w-4" />
                        Wymagane wystawienie proformy
                    </Button>
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
            if (status === 'order.paid') {
                 return (
                    <Button onClick={() => handleSupplierAction('forward')} disabled={isLoading} size="lg" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 font-semibold shadow-md">
                        {isLoading ? 'Przetwarzanie...' : (
                            <>
                                <Building2 className="mr-2 h-5 w-5" />
                                Zleć zamówienie u dostawcy
                            </>
                        )}
                    </Button>
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
                    <Button onClick={() => handleSupplierAction('invoice')} disabled={isLoading} size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700 font-semibold shadow-md">
                        {isLoading ? 'Generowanie...' : (
                            <>
                                <FileText className="mr-2 h-5 w-5" />
                                Wystaw Fakturę Końcową
                            </>
                        )}
                    </Button>
                );
            }
        }
        
        return null;
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Zamówienie #{order.id.slice(0, 8)}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-sm px-3 py-1 font-medium bg-slate-100 text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                         <Badge variant={isSampleOrder ? "outline" : "default"} className={cn("text-sm px-3 py-1 font-medium", !isSampleOrder ? "bg-indigo-500 hover:bg-indigo-600" : "")}>
                            {isSampleOrder ? 'Próbki (Szybka Ścieżka)' : 'Zamówienie (Pełny Proces)'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {renderActions()}
                </div>
            </div>

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

                    {currentFlow.map((step, idx) => {
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
                                {items.map((item: any, idx: number) => (
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
                        <CardHeader>
                            <CardTitle>Dane Klienta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-slate-100 p-2 rounded-full"><Package className="h-4 w-4 text-slate-600" /></div>
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
        </div>
    );
}
