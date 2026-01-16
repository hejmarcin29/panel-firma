import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Package } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface SuccessPageProps {
    searchParams: Promise<{
        orderId: string;
    }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
    const { orderId } = await searchParams;

    if (!orderId) {
        return (
            <div className="container py-24 flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold mb-4">Brak numeru zamówienia</h1>
                <Button asChild><Link href="/sklep">Wróć do sklepu</Link></Button>
            </div>
        );
    }

    let order: { reference: string | null; billingEmail: string; type: string; paymentMethod: string | null } | undefined;

    // 1. Check Shop Orders (Primary for this page)
    const shopOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: {
            sourceOrderId: true,
            billingAddress: true,
            type: true,
            paymentMethod: true,
        }
    });

    if (shopOrder) {
        order = {
            reference: shopOrder.sourceOrderId,
            billingEmail: shopOrder.billingAddress?.email || '',
            type: shopOrder.type,
            paymentMethod: shopOrder.paymentMethod,
        };
    }

    if (!order) {
        notFound();
    }

    return (
        <div className="container min-h-[80vh] flex items-center justify-center py-12">
            <Card className="w-full max-w-lg shadow-lg border-emerald-100">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl font-playfair text-emerald-900">
                        Dziękujemy za zamówienie!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <div className="space-y-2">
                        <p className="text-muted-foreground">
                            Twoje zamówienie zostało pomyślnie złożone.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border">
                            <p className="text-sm text-slate-500">Numer zamówienia</p>
                            <p className="text-xl font-bold font-mono text-slate-900">{order.reference}</p>
                        </div>
                    </div>

                    <div className="text-sm text-left bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 space-y-3">
                        <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Co dalej?
                        </h4>
                        <ul className="list-disc list-inside space-y-1.5 text-emerald-800">
                            <li>Wysłaliśmy potwierdzenie na adres: <strong>{order.billingEmail}</strong>.</li>
                            {order.paymentMethod === 'proforma' && (
                                <li>
                                    Wkrótce otrzymasz fakturę proforma.
                                    Towar zostanie wysłany (lub zamówiony u producenta) po zaksięgowaniu wpłaty.
                                </li>
                            )}
                            {order.paymentMethod === 'tpay' && (
                                <li>
                                   Płatność została przyjęta do realizacji. Przygotowujemy Twoje próbki do wysyłki.
                                </li>
                            )}
                            <li>O statusie realizacji będziemy informować w kolejnych wiadomościach.</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                        <Button variant="outline" asChild>
                            <Link href="/sklep">
                                <Home className="mr-2 h-4 w-4" />
                                Wróć do sklepu
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
