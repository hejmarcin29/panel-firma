import { notFound } from 'next/navigation';
import { db } from "@/lib/db";
import { manualOrders, erpOrderTimeline } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { verifyMagicLinkToken } from "@/lib/auth/magic-link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TimelineView, TimelineEvent } from "@/components/shop/timeline-view";

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

    // Fetch Order
    const order = await db.query.manualOrders.findFirst({
        where: eq(manualOrders.id, orderId),
        with: {
            // items: true // If relations set up, fetching items would be good
        }
    });

    if (!order) {
        return notFound();
    }

    // Fetch Timeline (Safe fetch in case table not ready)
    let timelineEvents: TimelineEvent[] = [];
    try {
        const rawEvents = await db.query.erpOrderTimeline.findMany({
            where: eq(erpOrderTimeline.orderId, orderId),
            orderBy: asc(erpOrderTimeline.createdAt)
        });
        
        timelineEvents = rawEvents as unknown as TimelineEvent[];
    } catch (e) {
        console.error("Timeline fetch failed (table might be missing):", e);
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Status Zamówienia</h1>
                    <p className="text-muted-foreground mt-2">
                        Realizacja zamówienia <span className="font-mono font-medium text-black">#{order.reference}</span>
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content: Timeline */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historia realizacji</CardTitle>
                                <CardDescription>Wszystkie zdarzenia dotyczące Twojego zamówienia</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TimelineView events={timelineEvents} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Szczegóły</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Aktualny status</div>
                                    <Badge className="mt-1 text-base capitalize" variant="secondary">
                                        {order.status}
                                    </Badge>
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm text-muted-foreground">Data złożenia</div>
                                    <div className="font-medium">
                                        {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm text-muted-foreground mr-2">Wartość zam.</div>
                                    <div className="font-medium text-lg">
                                        {(order.totalGross / 100).toFixed(2)} {order.currency}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm text-muted-foreground">Dostawa</div>
                                    <div className="font-medium">{order.shippingMethod || 'Odbiór osobisty'}</div>
                                    <div className="text-sm mt-1">
                                        {order.shippingCity}, {order.shippingStreet}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
