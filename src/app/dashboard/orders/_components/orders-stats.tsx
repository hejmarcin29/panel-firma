
import { CreditCard, DollarSign, Package, ShoppingCart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '../data';

interface OrdersStatsProps {
  orders: Order[];
}

export function OrdersStats({ orders }: OrdersStatsProps) {
  const totalOrders = orders.length;
  
  const totalRevenue = orders.reduce((acc, order) => acc + order.totals.totalGross, 0);
  
  const activeOrders = orders.filter(
    (order) => order.status !== 'order.closed' && order.status !== 'cancelled'
  ).length;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex overflow-x-auto pb-2 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
      <Card className="min-w-[240px] md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Całkowity Przychód</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            Z {totalOrders} zamówień
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-[240px] md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktywne Zamówienia</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeOrders}</div>
          <p className="text-xs text-muted-foreground">
            Wymagające uwagi
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-[240px] md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Średnia Wartość</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
          <p className="text-xs text-muted-foreground">
            Na zamówienie
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-[240px] md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wszystkie Zamówienia</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            W bazie danych
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
