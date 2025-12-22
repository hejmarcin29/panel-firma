import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { getDashboardStats } from "./dashboard-actions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ERPDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* 1. KPI Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indeksy (Razem)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsCount}</div>
            <p className="text-xs text-muted-foreground">
              w tym {stats.servicesCount} usług
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dostawcy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suppliersCount}</div>
            <p className="text-xs text-muted-foreground">
              Aktywni partnerzy i zespół
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Braki Danych</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.productsWithoutCategory > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithoutCategory}</div>
            <p className="text-xs text-muted-foreground">
              Produktów bez kategorii
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 2. Data Hygiene / Actions */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Wymaga uwagi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.productsWithoutCategory > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Produkty bez kategorii</p>
                    <p className="text-xs text-muted-foreground">
                      Przypisz kategorie, aby uporządkować magazyn.
                    </p>
                  </div>
                  <Link href="/dashboard/erp/products" className="text-sm font-medium text-primary hover:underline">
                    Napraw ({stats.productsWithoutCategory})
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[150px] text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                <p>Wszystko wygląda dobrze!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Recent Activity Feed */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ostatnio dodane
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Brak aktywności.</p>
              ) : (
                stats.recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category?.name || 'Bez kategorii'} • {product.sku}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
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
