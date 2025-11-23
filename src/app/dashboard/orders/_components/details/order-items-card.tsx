import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order } from '../../data';
import { formatCurrency, formatNumber, computePackageArea, computeTotalArea } from './utils';

interface OrderItemsCardProps {
  order: Order;
}

export function OrderItemsCard({ order }: OrderItemsCardProps) {
  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">Pozycje zamówienia</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile View */}
        <div className="divide-y md:hidden">
          {order.items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{item.product}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(item.quantity)} szt. × {formatCurrency(item.unitPrice, order.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(item.totalGross, order.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    VAT {item.vatRate}%
                  </p>
                </div>
              </div>
              {(item.unitPricePerSquareMeter > 0) && (
                 <div className="mt-2 flex gap-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div>
                        <span className="block text-[10px] uppercase">M² w op.</span>
                        <span className="font-medium text-foreground">{formatNumber(computePackageArea(item))}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase">M² łącznie</span>
                        <span className="font-medium text-foreground">{formatNumber(computeTotalArea(item))}</span>
                    </div>
                 </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40%]">Produkt</TableHead>
                <TableHead className="text-right">Ilość</TableHead>
                <TableHead className="text-right">M² w op.</TableHead>
                <TableHead className="text-right">M² łącznie</TableHead>
                <TableHead className="text-right">Cena netto</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">Wartość brutto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const perPackageArea = computePackageArea(item);
                const totalArea = computeTotalArea(item);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-sm">{item.product}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatNumber(perPackageArea)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatNumber(totalArea)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice, order.currency)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.vatRate}%</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.totalGross, order.currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
