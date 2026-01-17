import { notFound } from 'next/navigation';
import { db } from "@/lib/db";
import { orders, erpProducts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { verifyMagicLinkToken } from "@/lib/auth/magic-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, ShoppingCart, Phone, Mail, FileText, Download, CheckCircle2, MapPin, HeartHandshake, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreHeader } from "@/app/(storefront)/_components/store-header";
import { StoreFooter } from "@/app/(storefront)/_components/store-footer";
import Image from "next/image";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";
import { PaymentDetailsCard } from "./_components/payment-details-card";
import { PaymentSuccessCard } from "./_components/payment-success-card";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OrderStatusPage({ searchParams }: PageProps) {
    const { token } = await searchParams;
    const shopConfig = await getShopConfig();
    
    if (!token || typeof token !== 'string') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Brak dostępu</CardTitle>
                        <CardDescription>Nieprawidłowy link do zamówienia.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const orderId = verifyMagicLinkToken(token);

    if (!orderId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Link wygasł</CardTitle>
                        <CardDescription>Ten link jest nieprawidłowy lub wygasł. Skontaktuj się z obsługą sklepu.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Try Shop Order
    const orderRaw = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            items: true,
            documents: true
        }
    });

    if (!orderRaw) {
        return notFound();
    }

    // Fetch Product Images
    const skus = orderRaw.items.map(item => item.sku).filter((sku): sku is string => !!sku);
    const productImagesMap: Record<string, string> = {};
    
    if (skus.length > 0) {
        const products = await db.query.erpProducts.findMany({
            where: inArray(erpProducts.sku, skus),
            with: {
                images: true
            }
        });
        
        products.forEach(p => {
            if (p.images && p.images.length > 0) {
                productImagesMap[p.sku] = p.images[0].url;
            }
        });
    }

    // Normalize Data for View
    const orderItemsList = orderRaw.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: 'szt.',
        price: item.unitPrice,
        sku: item.sku,
        imageUrl: item.sku ? productImagesMap[item.sku] : null
    }));

    const order = {
        id: orderRaw.id,
        reference: orderRaw.displayNumber || orderRaw.sourceOrderId || orderRaw.id,
        createdAt: orderRaw.createdAt,
        status: orderRaw.status,
        totalGross: orderRaw.totalGross,
        currency: orderRaw.currency,
        billingEmail: orderRaw.billingAddress?.email || '',
        billingName: orderRaw.billingAddress?.name || '',
        billingStreet: orderRaw.billingAddress?.street || '',
        billingCity: orderRaw.billingAddress?.city || '',
        billingPostcode: orderRaw.billingAddress?.postalCode || '',
        isShop: true,
        shippingCarrier: orderRaw.shippingCarrier,
        shippingTrackingNumber: orderRaw.shippingTrackingNumber,
        documents: orderRaw.documents || []
    };

    // Determine Stepper State
    const steps = [
        { id: 1, label: 'Przyjęte', active: true, completed: true }, // Always placed
        { id: 2, label: 'Opłacone', active: ['order.paid', 'order.advance_invoice', 'order.forwarded_to_supplier', 'order.fulfillment_confirmed', 'order.final_invoice', 'order.closed'].includes(order.status), completed: ['order.paid', 'order.advance_invoice', 'order.forwarded_to_supplier', 'order.fulfillment_confirmed', 'order.final_invoice', 'order.closed'].includes(order.status) },
        { id: 3, label: 'W Realizacji', active: ['order.forwarded_to_supplier', 'order.fulfillment_confirmed', 'order.final_invoice', 'order.closed'].includes(order.status), completed: ['order.fulfillment_confirmed', 'order.final_invoice', 'order.closed'].includes(order.status) },
        { id: 4, label: 'Wysłane', active: ['order.fulfillment_confirmed', 'order.final_invoice', 'order.closed'].includes(order.status), completed: ['order.closed'].includes(order.status) },
        { id: 5, label: 'Dostarczone', active: order.status === 'order.closed', completed: order.status === 'order.closed' }
    ];

    const currentStepIndex = steps.filter(s => s.active).length - 1;

    // Categorize Documents
    const proformaDoc = order.documents.find(d => d.type === 'proforma');
    const advanceDoc = order.documents.find(d => d.type === 'advance_invoice');
    const finalDoc = order.documents.find(d => d.type === 'final_invoice');

    const proformaUrl = proformaDoc?.pdfUrl;
    const advanceUrl = advanceDoc?.pdfUrl;
    const finalUrl = finalDoc?.pdfUrl;

    const getTrackingUrl = (carrier: string | null, number: string | null) => {
        if (!number) return '#';
        const c = (carrier || '').toLowerCase();
        if (c.includes('inpost')) return `https://inpost.pl/sledzenie-przesylek?number=${number}`;
        if (c.includes('dhl')) return `https://sprawdz.dhl.com.pl/szukaj.aspx?m=0&sn=${number}`;
        if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${number}`;
        if (c.includes('dpd')) return `https://tracktrace.dpd.com.pl/parcelDetails?typ=1&p1=${number}`;
        if (c.includes('gls')) return `https://gls-group.eu/PL/pl/sledzenie-paczek?match=${number}`;
        if (c.includes('geodis') || c.includes('pekaes') || c.includes('pekae')) return `https://strefaklienta.pekaes.geodis.pl/t-and-t`;
        if (c.includes('raben')) return `https://my.raben-group.com/tracking`;
        if (c.includes('schenker')) return `https://eschenker.dbschenker.com/app/tracking-public/`;
        return '#';
    };

    const whatsappMessage = encodeURIComponent(`Dzień dobry, piszę w sprawie zamówienia #${order.reference} (${order.billingName}). Mam pytanie o...`);
    const whatsappUrl = `https://wa.me/48792303192?text=${whatsappMessage}`;

    return (
        <div className="flex min-h-screen flex-col bg-gray-50/30">
            <StoreHeader />
            
            <main className="flex-1 py-12">
                <div className="container px-4 md:px-6">
                    
                    {/* Hero Header */}
                    <div className="mb-10 text-center md:text-left">
                        <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-full mb-4">
                             <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Dziękujemy za zamówienie, {order.billingName.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground text-lg">
                            Przyjęliśmy Twoje zamówienie do realizacji. Numer zamówienia: <span className="font-mono font-medium text-foreground">#{order.reference}</span>
                        </p>
                    </div>

                    <div className="grid gap-10 lg:grid-cols-3">
                        {/* LEFT COLUMN (2/3) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* PAYMENT AWAITING CARD */}
                            {order.status === 'order.awaiting_payment' && (
                                <PaymentDetailsCard 
                                    shopConfig={shopConfig} 
                                    orderReference={order.reference} 
                                    totalGross={order.totalGross} 
                                    currency={order.currency}
                                    proformaUrl={proformaUrl}
                                />
                            )}

                            {/* PAYMENT SUCCESS CARD */}
                            {order.status !== 'order.awaiting_payment' && order.status !== 'order.received' && order.status !== 'order.cancelled' && (
                                <PaymentSuccessCard 
                                    advanceDocUrl={advanceUrl}
                                    finalDocUrl={finalUrl}
                                    statusLabel={steps[currentStepIndex]?.label || 'W trakcie'}
                                />
                            )}

                            {/* Visual Stepper */}
                            <Card className="border-none shadow-md overflow-hidden">
                                <CardContent className="p-8">
                                    <h3 className="font-semibold mb-8 flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-primary" />
                                        Status Przesyłki
                                    </h3>
                                    <div className="relative">
                                        {/* Progress Bar Background */}
                                        <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 rounded-full -z-10" />
                                        
                                        {/* Active Progress */}
                                        <div 
                                            className="absolute top-4 left-0 h-1 bg-primary rounded-full -z-10 transition-all duration-1000" 
                                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                        />

                                        <div className="flex justify-between w-full">
                                            {steps.map((step) => (
                                                <div key={step.id} className="flex flex-col items-center gap-3">
                                                    <div className={`
                                                        w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white
                                                        ${step.completed ? 'border-primary bg-primary text-white' : 
                                                          step.active ? 'border-primary text-primary' : 'border-gray-200 text-gray-300'}
                                                    `}>
                                                        {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 bg-current rounded-full" />}
                                                    </div>
                                                    <span className={`text-xs font-medium text-center ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tracking Info Alert */}
                                    {order.shippingTrackingNumber && (
                                        <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-full shadow-sm">
                                                    <Package className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900">Paczka jest w drodze!</p>
                                                    <p className="text-xs text-blue-700">Nr przesyłki: <span className="font-mono">{order.shippingTrackingNumber}</span> ({order.shippingCarrier})</p>
                                                </div>
                                            </div>
                                            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-none" asChild>
                                                <a href={getTrackingUrl(order.shippingCarrier, order.shippingTrackingNumber)} target="_blank" rel="noopener noreferrer">
                                                    Śledź przesyłkę
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Product List */}
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5 text-gray-500" />
                                        Zamówione Produkty
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {orderItemsList.map((item) => (
                                            <div key={item.id} className="flex gap-4 items-start pb-6 border-b last:border-0 last:pb-0 border-gray-100">
                                                <div className="h-20 w-20 shrink-0 bg-gray-100 rounded-md overflow-hidden relative border">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                            <Package className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">Ilość: {item.quantity} {item.unit}</p>
                                                    {item.sku && <p className="text-xs text-gray-400 mt-1">SKU: {item.sku}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Documents (If any) */}
                            {order.documents && order.documents.length > 0 && (
                                <Card className="border-none shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                            Dokumenty
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {order.documents.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                                    <div className="flex gap-3 items-center overflow-hidden">
                                                        <FileText className="w-8 h-8 text-gray-400 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm truncate">{doc.number || 'Dokument'}</p>
                                                            <p className="text-xs text-muted-foreground capitalize">{doc.type.replace('_', ' ')}</p>
                                                        </div>
                                                    </div>
                                                    {doc.pdfUrl && (
                                                        <Button size="icon" variant="ghost" className="shrink-0" asChild>
                                                            <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        </div>

                        {/* RIGHT COLUMN (1/3) */}
                        <div className="space-y-6">
                            
                            {/* What's Next? (Placeholders) */}
                            <Card className="border-none shadow-md bg-white">
                                <CardHeader>
                                    <CardTitle className="text-lg">Co dalej?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-gray-200 hover:bg-gray-50 hover:text-primary" asChild>
                                        <a href="#">
                                            <div className="bg-primary/10 p-2 rounded-full mr-3 text-primary">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-semibold text-sm text-foreground">Instrukcja Montażu</span>
                                                <span className="block text-xs text-muted-foreground font-normal">Pobierz PDF przed dostawą</span>
                                            </div>
                                        </a>
                                    </Button>

                                    <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-gray-200 hover:bg-gray-50 hover:text-primary" asChild>
                                        <a href="#">
                                            <div className="bg-primary/10 p-2 rounded-full mr-3 text-primary">
                                                <HeartHandshake className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-semibold text-sm text-foreground">Pielęgnacja Podłogi</span>
                                                <span className="block text-xs text-muted-foreground font-normal">Sprawdź jak dbać o produkt</span>
                                            </div>
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Summary Card */}
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Podsumowanie</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Cost */}
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Wartość zamówienia</p>
                                        <p className="text-3xl font-bold tracking-tight">
                                            {(order.totalGross / 100).toFixed(2)} <span className="text-sm font-normal text-gray-500">{order.currency}</span>
                                        </p>
                                    </div>

                                    {/* Document Repository (Wallet) */}
                                    {(proformaUrl || advanceUrl || finalUrl) && (
                                        <div className="space-y-2 pt-2">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Dokumenty Finansowe</p>
                                            
                                            {proformaUrl && (
                                                <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" asChild>
                                                    <a href={proformaUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileText className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                                        Proforma
                                                    </a>
                                                </Button>
                                            )}
                                            
                                            {advanceUrl && (
                                                <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" asChild>
                                                    <a href={advanceUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileCheck className="w-3.5 h-3.5 mr-2 text-green-600" />
                                                        Faktura Zaliczkowa
                                                    </a>
                                                </Button>
                                            )}

                                            {finalUrl && (
                                                <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" asChild>
                                                    <a href={finalUrl} target="_blank" rel="noopener noreferrer">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                                        Faktura Końcowa
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <Separator />

                                    {/* Address */}
                                    <div className="flex gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div className="text-sm text-muted-foreground">
                                            <p className="font-medium text-gray-900 mb-1">Dane do faktury</p>
                                            <p>{order.billingName}</p>
                                            <p>{order.billingStreet}</p>
                                            <p>{order.billingPostcode} {order.billingCity}</p>
                                            <p className="mt-2">{order.billingEmail}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Support Card */}
                            <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/10">
                                <div className="flex items-center gap-4 mb-4">
                                     <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/20">
                                        MP
                                     </div>
                                     <div>
                                        <h4 className="font-bold text-gray-900">Marcin Przybyła</h4>
                                        <p className="text-xs text-primary font-medium uppercase tracking-wider">Twój opiekun</p>
                                     </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    Masz pytania dotyczące zamówienia lub montażu? Jestem do Twojej dyspozycji na WhatsApp.
                                </p>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                     <Button className="w-full bg-white hover:bg-white/90 text-primary border border-primary/20 shadow-sm" asChild>
                                        <a href="tel:+48792303192">
                                            <Phone className="w-4 h-4 mr-2" />
                                            Zadzwoń
                                        </a>
                                     </Button>
                                     <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md shadow-green-900/10 border-none" asChild>
                                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </a>
                                     </Button>
                                </div>
                                <div className="text-center">
                                    <a href={`mailto:biuro@primepodloga.pl?subject=Zamówienie ${order.reference}`} className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dotted">
                                        lub napisz wiadomość e-mail
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <StoreFooter />
        </div>
    );
}
