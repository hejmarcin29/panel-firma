import { getShopStats } from './actions';
import { QuickLinkGenerator } from './_components/QuickLinkGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, FileText, Banknote, Package, ArrowRight, TrendingUp, Activity, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ShopIndexPage() {
    const stats = await getShopStats();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Przegląd Sklepu</h2>
                    <p className="text-muted-foreground">Panel zarządzania sprzedażą online.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        Raporty PDF
                    </Button>
                    <Button size="sm" className="bg-[--primary] hover:bg-[--primary]/90">
                        <ShoppingCart className="mr-2 h-4 w-4" /> Nowe Zamówienie
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-t-4 border-t-zinc-500 shadow-sm relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wszystkie Zamówienia</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                            <span className="text-emerald-500 font-medium">{stats.trend}</span>
                            <span className="ml-1">vs ostatni tydzień</span>
                        </p>
                        {/* Sparkline Decorator */}
                        <div className="absolute bottom-0 right-0 w-24 h-12 opacity-10">
                             <svg viewBox="0 0 100 40" className="fill-current text-zinc-900">
                                <path d="M0 40 L0 30 L20 20 L40 25 L60 10 L80 15 L100 0 L100 40 Z" />
                             </svg>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-t-4 border-t-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oczekuje na Proformę</CardTitle>
                        <FileText className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.pendingProforma}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pilne do wystawienia</p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Płatności Online</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">{stats.awaitingPayment}</div>
                        <p className="text-xs text-muted-foreground mt-1">Oczekuje na bramkę Tpay</p>
                    </CardContent>
                </Card>
                
                <Card className="border-t-4 border-t-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Zrealizowane</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Zamknięte pomyślnie</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
                {/* Main Content Area: Recent Activity Table */}
                <div className="md:col-span-4 lg:col-span-5 space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Ostatnia Aktywność
                            </CardTitle>
                            <CardDescription>Najnowsze zamówienia spływające ze sklepu.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead>
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">ID</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Klient</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentOrders.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground">Brak ostatnich zamówień.</td>
                                            </tr>
                                        )}
                                        {stats.recentOrders.map((order) => (
                                            <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-2 font-medium">
                                                    <Link href={`/dashboard/shop/orders/${order.id}`} className="hover:underline text-indigo-600">
                                                        #{order.id.slice(0, 8)}
                                                    </Link>
                                                </td>
                                                <td className="p-2 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
                                                            <User className="h-3 w-3 text-zinc-500" />
                                                        </div>
                                                        <span className="truncate max-w-[120px]">{order.customer?.name || order.customer?.email || 'Gość'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-2 text-right text-muted-foreground text-xs flex items-center justify-end gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-center">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/dashboard/shop/orders">Zobacz wszystkie zamówienia <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Quick Actions & Tools */}
                <div className="md:col-span-3 lg:col-span-2 space-y-6">
                    <QuickLinkGenerator />

                    <Card>
                        <CardHeader>
                            <CardTitle>Narzędzia</CardTitle>
                            <CardDescription>Szybki dostęp</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Link href="/dashboard/shop/offer" className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 p-2 rounded-lg group-hover:scale-105 transition-transform">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div className="text-sm font-medium">Katalog Produktów</div>
                                </div>
                            </Link>
                             <Link href="/dashboard/settings/shop" className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 p-2 rounded-lg group-hover:scale-105 transition-transform">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="text-sm font-medium">Ustawienia Sklepu</div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-br from-indigo-50 to-white border-indigo-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-indigo-900">Potrzebujesz pomocy?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-indigo-700 mb-3">
                                Sprawdź dokumentację integracji z systemem ERP.
                            </p>
                            <Button variant="outline" size="sm" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                                Dokumentacja API
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
