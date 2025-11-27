"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Calendar, 
  Hammer, 
  Package, 
  Plus, 
  Users 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Montage } from "../montaze/types";
import type { Order } from "../orders/data";

interface DashboardStatsProps {
  montages: Montage[];
  orders: Order[];
  userName?: string | null;
}

export function DashboardStats({ montages, orders, userName }: DashboardStatsProps) {
  // Calculate stats
  const activeMontages = montages.filter(m => m.status !== 'lead');
  const upcomingMontages = montages.filter(m => {
    if (!m.scheduledInstallationAt) return false;
    const date = new Date(m.scheduledInstallationAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 0 && diffDays <= 7;
  });
  
  const pendingOrders = orders.filter(o => o.status !== 'order.closed' && o.status !== 'order.fulfillment_confirmed');
  const recentOrders = orders.slice(0, 5);
  const recentMontages = montages.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Witaj, {userName || 'Użytkowniku'} 👋</h1>
          <p className="text-muted-foreground hidden md:block">
            Oto podsumowanie Twoich działań w panelu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nowe zamówienie
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/montaze">
              <Hammer className="mr-2 h-4 w-4" />
              Centrum Montaży
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne montaże</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMontages.length}</div>
            <p className="text-xs text-muted-foreground">
              w toku realizacji
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nadchodzące montaże</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMontages.length}</div>
            <p className="text-xs text-muted-foreground">
              w najbliższych 7 dniach
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Otwarte zamówienia</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              wymagające obsługi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wszystkie leady</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{montages.filter(m => m.status === 'lead').length}</div>
            <p className="text-xs text-muted-foreground">
              nowe zapytania
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Montages */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Ostatnie montaże</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/montaze" className="text-xs">
                        Zobacz wszystkie <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>
            <CardDescription>
              Ostatnio aktualizowane projekty montażowe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {recentMontages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Brak aktywnych montaży.</p>
                ) : (
                    recentMontages.map((montage) => (
                        <div key={montage.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{montage.clientName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{montage.installationCity || 'Brak lokalizacji'}</span>
                                    <span>•</span>
                                    <span>{montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).toLocaleDateString() : 'Nie zaplanowano'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] uppercase">
                                    {montage.status}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/dashboard/montaze/${montage.id}`}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Ostatnie zamówienia</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/orders" className="text-xs">
                        Zobacz wszystkie <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>
            <CardDescription>
              Najnowsze zamówienia w systemie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Brak zamówień.</p>
                ) : (
                    recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {order.billing.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(order.totals.totalGross)}
                                </p>
                            </div>
                            <Badge variant={order.status === 'order.closed' ? 'secondary' : 'default'} className="text-[10px]">
                                {order.status}
                            </Badge>
                        </div>
                    ))
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
