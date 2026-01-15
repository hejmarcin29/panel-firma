import { notFound } from 'next/navigation';
import { db } from "@/lib/db";
import { manualOrders, erpOrderTimeline, orders } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { verifyMagicLinkToken } from "@/lib/auth/magic-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TimelineView, TimelineEvent } from "@/components/shop/timeline-view";
import { Package, Truck, Clock } from "lucide-react";

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
    });

    // 2. Try Shop Order (Storefront) if not found
    let shopOrder = null;
    if (!manualOrder) {
        shopOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
        });
    }

    if (!manualOrder && !shopOrder) {
        return notFound();
    }

    // Normalize Data for View
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
            isShop: false
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
            isShop: true
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

                    {/* Order Details */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                Podsumowanie
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
                </div>
            </div>
        </div>
    );
}
