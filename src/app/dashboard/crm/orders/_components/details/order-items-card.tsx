import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '../../data';
import { formatCurrency, formatNumber, computePackageArea, computeTotalArea } from './utils';
import { PackageOpen, Cuboid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderItemsCardProps {
  order: Order;
}

export function OrderItemsCard({ order }: OrderItemsCardProps) {
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4 bg-muted/10">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Produkty</CardTitle>
            <Badge variant="outline" className="bg-background">
                {order.items.length} {order.items.length === 1 ? 'pozycja' : 'pozycji'}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {order.items.map((item) => {
             const perPackageArea = computePackageArea(item);
             const totalArea = computeTotalArea(item);

             return (
              <div key={item.id} className="p-4 md:p-6 hover:bg-muted/10 transition-colors group">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    {/* Placeholder Image / Icon */}
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50">
                        <PackageOpen className="h-8 w-8 text-muted-foreground/50" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="font-semibold text-base md:text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                                    {item.product}
                                </h3>
                                {/* SKU placeholder if available (not in type yet but good for UI) */}
                                <p className="text-xs text-muted-foreground font-mono mt-1 opacity-70">
                                    SKU: {item.id.substring(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-bold text-lg">
                                    {formatCurrency(item.totalGross, order.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.vatRate}% VAT
                                </p>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="flex flex-wrap gap-3 md:gap-6 pt-1">
                             <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/30 border border-border/50">
                                <Cuboid className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {formatNumber(item.quantity)} <span className="text-xs text-muted-foreground font-normal">szt.</span>
                                </span>
                             </div>

                             {(perPackageArea > 0) && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-xs uppercase tracking-wider opacity-70">Opakowanie:</span>
                                      <span className="font-medium text-foreground">{formatNumber(perPackageArea)} m²</span>
                                   </div>
                                   <Separator orientation="vertical" className="h-4" />
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-xs uppercase tracking-wider opacity-70">Łącznie:</span>
                                      <span className="font-semibold text-foreground">{formatNumber(totalArea)} m²</span>
                                   </div>
                                </div>
                             )}

                             {/* Unit Price */}
                             <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                                 <span>{formatCurrency(item.unitPrice, order.currency)}</span>
                                 <span className="text-xs opacity-70">netto / szt.</span>
                             </div>
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer Summary - could be moved to separate component but fits nicely here for Context */}
        <div className="bg-muted/10 p-6 flex flex-col items-end gap-2 border-t border-border/50">
             <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Suma netto:</span>
                    <span>{formatCurrency(order.totals.totalNet, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Podatek VAT:</span>
                    <span>{formatCurrency(order.totals.totalVat, order.currency)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-foreground">Do zapłaty:</span>
                    <span className="text-2xl font-bold text-primary">
                        {formatCurrency(order.totals.totalGross, order.currency)}
                    </span>
                </div>
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
