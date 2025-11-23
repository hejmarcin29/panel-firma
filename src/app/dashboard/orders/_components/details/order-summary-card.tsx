import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Order } from '../../data';
import { formatCurrency } from './utils';

interface OrderSummaryCardProps {
  order: Order;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Podsumowanie</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Suma netto</span>
          <span>{formatCurrency(order.totals.totalNet, order.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>VAT</span>
          <span>{formatCurrency(order.totals.totalGross - order.totals.totalNet, order.currency)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center justify-between font-semibold text-base">
          <span>Do zapłaty</span>
          <span>{formatCurrency(order.totals.totalGross, order.currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
