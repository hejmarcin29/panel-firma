import { notFound } from 'next/navigation';
import { db } from "@/lib/db";
import { manualOrders, erpOrderTimeline, orders, manualOrderItems, orderItems } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { verifyMagicLinkToken } from "@/lib/auth/magic-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TimelineView, TimelineEvent } from "@/components/shop/timeline-view";
import { Package, Truck, Clock, ShoppingCart, Phone, Mail, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OrderStatusPage({ searchParams }: PageProps) {
    const { token } = await searchParams;
    
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

    // 1. Try Manual Order (CRM)
    const manualOrder = await db.query.manualOrders.findFirst({
        where: eq(manualOrders.id, orderId),
        with: {
            items: true // Fetch items
        }
    });

    // 2. Try Shop Order (Storefront) if not found
    let shopOrder = null;
    if (!manualOrder) {
        shopOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                items: true, // Fetch items
                documents: true // Fetch documents
            }
        });
    }

    if (!manualOrder && !shopOrder) {
        return notFound();
    }

    // Normalize Data for View
    const orderItemsList = manualOrder 
        ? manualOrder.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'szt.',
            price: item.price
        }))
        : shopOrder!.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'szt.', // Shop items usually have 'unit'
            price: item.price
        }));

    const order = manualOrder 
        ? {
            id: manualOrder.id,
            reference: manualOrder.reference,
            createdAt: manualOrder.createdAt,
            status: manualOrder.status,
            totalGross: manualOrder.totalGross,
            currency: manualOrder.currency,
            billingEmail: manualOrder.billingEmail,
            billingName: manualOrder.billingName,
            isShop: false,
            shippingCarrier: null,
            shippingTrackingNumber: null,
            documents: [] as any[] // Manual orders dont have documents relation in schema yet
        }
        : {
            id: shopOrder!.id,
            reference: shopOrder!.sourceOrderId || shopOrder!.id,
            createdAt: shopOrder!.createdAt,
            status: shopOrder!.status,
            totalGross: shopOrder!.totalGross,
            currency: shopOrder!.currency,
            billingEmail: shopOrder!.billingAddress?.email || '',
            billingName: shopOrder!.billingAddress?.name || '',
            isShop: true,
            shippingCarrier: shopOrder!.shippingCarrier,
            shippingTrackingNumber: shopOrder!.shippingTrackingNumber,
            documents: shopOrder!.documents || []
        };

    // Fetch Timeline (Safe fetch)
    let timelineEvents: TimelineEvent[] = [];
    
    // Only fetch from erpOrderTimeline if it's a manual order (due to FK constraints)
    // OR if we know shop orders also write there (unlikely given schema).
    if (!order.isShop) {
        try {
            const rawEvents = await db.query.erpOrderTimeline.findMany({
                where: eq(erpOrderTimeline.orderId, orderId),
                orderBy: asc(erpOrderTimeline.createdAt)
            });
            timelineEvents = rawEvents as unknown as TimelineEvent[];
        } catch (e) {
            console.error("Timeline fetch failed:", e);
        }
    } else {
        // Construct Synthetic Timeline for Shop Orders
        timelineEvents.push({
            id: 'created',
            type: 'system',
            title: 'Zamówienie złożone',
            createdAt: order.createdAt,
            metadata: null
        });
        
        // Basic map of known states
        if (order.status === 'order.paid' || order.status === 'order.fulfillment_confirmed' || order.status === 'order.sent') {
             timelineEvents.push({
                id: 'paid',
                type: 'payment',
                title: 'Płatność potwierdzona',
                createdAt: order.createdAt, // Approximation
                metadata: null
            });
        }
        
        if (order.status === 'order.sent') {
             timelineEvents.push({
                id: 'sent',
                type: 'status_change',
                title: 'Zamówienie wysłane',
                createdAt: order.createdAt, // Approximation
                metadata: null
            });
        }
    }

    // Helper for status badge
    const getStatusLabel = (s: string) => {
        const map: Record<string, string> = {
            'draft': 'Szkic',
            'pending': 'Oczekuje',
            'order.received': 'Przyjęte',
            'order.pending_proforma': 'Ocz. na Proformę',
            'order.proforma_issued': 'Proforma Wysłana',
            'order.awaiting_payment': 'Ocz. na Płatność',
            'order.paid': 'Opłacone',
            'order.fulfillment_confirmed': 'W Realizacji',
            'order.sent': 'Wysłane',
            'order.closed': 'Zakończone',
            'order.cancelled': 'Anulowane'
        };
        return map[s] || s;
    };

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

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                            {order.billingName.charAt(0)}
                         </div>
                         <div>
                             <h1 className="font-semibold text-lg leading-none">Zamówienie {order.reference}</h1>
                             <p className="text-xs text-muted-foreground mt-1">
                                Utworzono {format(order.createdAt, "d MMMM yyyy, HH:mm", { locale: pl })}
                             </p>
                         </div>
                    </div>
                    <Badge variant={order.status.includes('paid') || order.status.includes('sent') ? "default" : "secondary"}>
                        {getStatusLabel(order.status)}
                    </Badge>
                </div>
            </div>

            <div className="container py-8 max-w-3xl">
                <div className="space-y-6">
                    {/* Shipment Tracking Card */}
                    {(order.isShop && order.shippingTrackingNumber) && (
                        <Card className="bg-indigo-50 border-indigo-100">
                             <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
                                    <Truck className="h-4 w-4" />
                                    Twoja Przesyłka
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div>
                                        <p className="text-sm text-indigo-700 font-medium capitalize">
                                            Przewoźnik: {order.shippingCarrier}
                                        </p>
                                        <p className="text-xs text-indigo-600">
                                            Nr przesyłki: <span className="font-mono bg-white/50 px-1 rounded">{order.shippingTrackingNumber}</span>
                                        </p>
                                    </div>
                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto" asChild>
                                        <a href={getTrackingUrl(order.shippingCarrier, order.shippingTrackingNumber)} target="_blank" rel="noopener noreferrer">
                                            Śledź przesyłkę
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Status Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Historia Realizacji
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timelineEvents.length > 0 ? (
                                <TimelineView events={timelineEvents} />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Brak zdarzeń na osi czasu.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents Card */}
                    {order.documents && order.documents.length > 0 && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Dokumenty
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {order.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 border rounded text-slate-500">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{doc.number || 'Dokument bez numeru'}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{doc.type.replace('_', ' ')} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {doc.pdfUrl ? (
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                        <Download className="h-4 w-4" />
                                                        Pobierz
                                                    </a>
                                                </Button>
                                            ) : (
                                               <Badge variant="outline">Przetwarzanie</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Details & Items */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                Lista Produktów
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {orderItemsList.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start text-sm border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex-1 pr-4">
                                            <span className="font-medium block">{item.name}</span>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <span className="font-semibold">{item.quantity} {item.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                Dane Zamówienia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Kwota do zapłaty</span>
                                    <span className="font-semibold text-lg">
                                        {(order.totalGross / 100).toFixed(2)} {order.currency}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Adres Email</span>
                                    <span>{order.billingEmail}</span>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-md flex gap-3">
                                <Truck className="h-5 w-5 shrink-0" />
                                <p>
                                    Twoje zamówienie jest bezpieczne. Poinformujemy Cię mailowo o każdej zmianie statusu oraz nadaniu przesyłki.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dedicated Support Contact */}
                    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-base">Potrzebujesz pomocy?</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                                    MP
                                    {/* <img src="/marcin.jpg" className="h-full w-full rounded-full object-cover" /> */}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="font-semibold text-foreground">Marcin Przybyła</div>
                                    <div className="text-xs text-muted-foreground">Twój opiekun zamówienia</div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                     <Button variant="outline" size="sm" className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 text-primary" asChild>
                                        <a href="tel:+48792303192">
                                            <Phone className="h-3.5 w-3.5" />
                                            Zadzwoń
                                        </a>
                                     </Button>
                                     <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                                        <a href={`mailto:biuro@primepodloga.pl?subject=Pytanie do zamówienia ${order.reference}`}>
                                            <Mail className="h-3.5 w-3.5" />
                                            Napisz
                                        </a>
                                     </Button>
                                </div>
                             </div>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-muted-foreground pt-4">
                        &copy; 2026 Prime Podłoga. Wszystkie prawa zastrzeżone.
                    </p>
                </div>
            </div>
        </div>
    );
}
