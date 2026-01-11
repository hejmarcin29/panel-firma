import { getShopStats } from './actions';
import { QuickLinkGenerator } from './_components/QuickLinkGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, FileText, Banknote, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ShopIndexPage() {
    const stats = await getShopStats();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Przegląd Sklepu</h2>
                <p className="text-muted-foreground">Statystyki i szybkie akcje dla modułu sprzedażowego.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wszystkie Zamówienia</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Ze sklepu online</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oczekuje na Proformę</CardTitle>
                        <FileText className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.pendingProforma}</div>
                        <p className="text-xs text-muted-foreground">Wymagają wystawienia dokumentu</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Płatności Online (Tpay)</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.awaitingPayment}</div>
                        <p className="text-xs text-muted-foreground">Oczekujące na wpłatę</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Zrealizowane</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">Zamknięte pomyślnie</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <QuickLinkGenerator />

                <Card>
                    <CardHeader>
                        <CardTitle>Skróty</CardTitle>
                        <CardDescription>Szybki dostęp do najważniejszych funkcji.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/dashboard/shop/orders" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                                    <ShoppingCart className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="font-medium">Obsługa Zamówień</p>
                                    <p className="text-xs text-muted-foreground">Przeglądaj i realizuj wpływające zamówienia</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>

                         <Link href="/dashboard/shop/offer" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="bg-purple-100 text-purple-700 p-2 rounded-lg">
                                    <Package className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="font-medium">Zarządzanie Ofertą</p>
                                    <p className="text-xs text-muted-foreground">Włączaj produkty i ustawiaj dostępność próbek</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
