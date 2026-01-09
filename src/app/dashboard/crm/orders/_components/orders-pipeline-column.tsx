"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { ORDER_STATUSES } from "../utils";
import { OrdersPipelineCard } from "./orders-pipeline-card";
import { Order } from "../data";

interface OrdersPipelineColumnProps {
  statusId: string;
  orders: Order[];
  className?: string;
}

export function OrdersPipelineColumn({ statusId, orders, className }: OrdersPipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
    data: {
        type: "Column",
        statusId
    }
  });

  const statusDef = ORDER_STATUSES.find((s) => s.id === statusId);

  const orderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const totalValue = useMemo(() => orders.reduce((acc, curr) => acc + (curr.totals?.totalGross || 0), 0), [orders]);

  // Format currency roughly for header
  const formattedTotal = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(totalValue);

  return (
    <div className={cn("flex flex-col h-full bg-zinc-50/50 rounded-xl border border-zinc-200/60 overflow-hidden", className)}>
        {/* Header */}
        <div className={cn("p-3 border-b flex flex-col gap-1 bg-white", isOver && "bg-blue-50/50")}>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-sm text-zinc-900">
                        {statusDef?.label || statusId}
                    </h3>
                    <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-mono">
                         {orders.length}
                    </Badge>
                </div>
             </div>
             <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                 Suma: {formattedTotal}
             </div>
             {statusDef?.description && (
                 <p className="text-[10px] text-zinc-500 line-clamp-1" title={statusDef.description}>
                     {statusDef.description}
                 </p>
             )}
        </div>

        {/* Content */}
        <div 
            ref={setNodeRef} 
            className={cn(
                "flex-1 p-2 bg-zinc-100/50 transition-colors",
                isOver && "bg-blue-50/30 ring-2 ring-inset ring-blue-200"
            )}
        >
             <ScrollArea className="h-full pr-2.5 -mr-2.5">
                <div className="flex flex-col gap-2 pb-2">
                    {/* Sortable Context is mainly for reordering, even if we just drop in list */}
                    {/* Since we don't have explicit sorting order in DB for orders yet, we just render them */}
                    {/* However, dnd-kit works best with SortableContext for items */}
                    
                    {orders.map((order) => (
                         <OrdersPipelineCard key={order.id} order={order} />
                    ))}

                    {orders.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-xs text-zinc-400 border-2 border-dashed border-zinc-200 rounded-lg">
                            Brak zamówień
                        </div>
                    )}
                </div>
             </ScrollArea>
        </div>
    </div>
  );
}
