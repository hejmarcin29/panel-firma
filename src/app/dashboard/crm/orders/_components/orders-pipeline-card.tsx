"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

import { ORDER_STATUSES } from "../utils";

import { Order } from "../data";
// PipelineOrder interface removed in favor of Order

interface OrdersPipelineCardProps {
    order: Order;
    disabled?: boolean;
}

export function OrdersPipelineCard({ order, disabled }: OrdersPipelineCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: {
            type: "Order",
            order,
        },
        disabled,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    const statusDef = ORDER_STATUSES.find(s => s.id === order.status);
    const dateStr = new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });

    if (isDragging) {
        return (
             <div
                ref={setNodeRef}
                style={style}
                className="opacity-50"
            >
                <Card className="shadow-md border-primary/50 bg-accent/50">
                    <CardHeader className="p-4 pb-2">
                        <div className="h-4 w-24 bg-primary/20 rounded animate-pulse" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="h-8 w-full bg-primary/10 rounded animate-pulse" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none group">
            <Card className={cn(
                "cursor-grab active:cursor-grabbing hover:border-zinc-400 transition-colors shadow-sm",
                disabled && "opacity-75 cursor-default"
            )}>
                 <CardContent className="p-3 space-y-3">
                    {/* Header: Ref & Date */}
                    <div className="flex items-center justify-between">
                         <Badge variant="outline" className="font-mono text-[10px] tracking-tight hover:bg-zinc-100">
                            {order.reference}
                        </Badge>
                        <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{dateStr}</span>
                        </div>
                    </div>

                    {/* Client & Value */}
                    <div className="space-y-1">
                        <div className="font-medium text-sm text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                             {order.billing?.name || "Klient detaliczny"}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {/* Optional: Source Icon */}
                                {order.source === 'woocommerce' && <span title="Sklep">🛒</span>}
                            </div>
                            <div className="font-bold text-zinc-900 text-sm">
                                {formatCurrency(order.totals?.totalGross || 0)}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t flex items-center justify-between">
                         <div className={cn("text-[10px] px-1.5 py-0.5 rounded border truncate max-w-[120px]", statusDef?.color)}>
                            {statusDef?.label || order.status}
                         </div>
                         <Button asChild size="icon" variant="ghost" className="h-6 w-6 -mr-1 text-zinc-400 hover:text-zinc-900">
                             <Link href={`/dashboard/crm/orders/${order.id}`}>
                                <ArrowRight className="h-3 w-3" />
                             </Link>
                         </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
