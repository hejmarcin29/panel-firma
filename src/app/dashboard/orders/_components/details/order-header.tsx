'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Mail, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatusForm } from '../order-status-form';
import type { Order } from '../../data';
import { formatDate } from './utils';

interface OrderHeaderProps {
  order: Order;
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {order.reference}
          </h1>
          <Badge variant="outline" className="ml-2">
            {order.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:pl-6">
          <p>
            Utworzono: <span className="text-foreground">{formatDate(order.createdAt)}</span>
          </p>
          <p>
            Kanał: <span className="text-foreground">{order.channel}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-6">
        <div className="w-full sm:w-auto">
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href={`/dashboard/orders/${order.id}/print`}>
                <Printer className="mr-2 h-3.5 w-3.5" />
                Drukuj
            </Link>
            </Button>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`mailto:${order.billing.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Wyślij e-mail
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="sm:hidden">
                    <Link href={`/dashboard/orders/${order.id}/print`}>
                        <Printer className="mr-2 h-4 w-4" />
                        Drukuj
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
