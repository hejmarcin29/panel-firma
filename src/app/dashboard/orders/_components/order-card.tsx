import Link from "next/link";
import { MoreHorizontal, FileText, Mail, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import type { Order } from "../data";
import { OrderStatusBadge } from "./order-status-badge";
import { ConfirmOrderButton } from "./confirm-order-button";

interface OrderCardProps {
  order: Order;
  formatCurrency: (amount: number, currency: string) => string;
  formatDateTime: (date: string) => string;
}

export function OrderCard({ order, formatCurrency, formatDateTime }: OrderCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="border-b bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Link 
                href={`/dashboard/orders/${order.id}`}
                className="font-semibold hover:underline text-base"
              >
                {order.reference}
              </Link>
              {order.requiresReview && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-auto">
                  Weryfikacja
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
              {order.source === 'woocommerce' ? 'WooCommerce' : 'Ręczne'}
            </span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Klient</span>
            <span className="font-medium truncate">{order.customer}</span>
            <span className="text-xs text-muted-foreground truncate">{order.billing.email}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Kwota</span>
            <span className="font-bold text-lg text-primary">
              {formatCurrency(order.totals.totalGross, order.currency)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </span>
          
          <div className="flex items-center gap-2">
            {order.requiresReview && (
              <ConfirmOrderButton orderId={order.id} />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Więcej opcji</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Szczegóły
                  </Link>
                </DropdownMenuItem>
                {/* Placeholder actions for future implementation */}
                <DropdownMenuItem disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Pobierz proformę
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Mail className="mr-2 h-4 w-4" />
                  Wyślij wiadomość
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
