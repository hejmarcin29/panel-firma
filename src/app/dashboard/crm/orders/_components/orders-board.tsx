"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { OrderStatus } from "../utils";
import { OrdersPipelineCard } from "./orders-pipeline-card";
import { OrdersPipelineColumn } from "./orders-pipeline-column";
import { updateOrderStatus } from "../actions";
import { Order } from "../data";

interface OrdersBoardProps {
  orders: Order[];
}

export function OrdersBoard({ orders: initialOrders }: OrdersBoardProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const VISIBLE_COLUMNS: OrderStatus[] = [
    'order.received',
    'order.pending_proforma',
    'order.proforma_issued',
    'order.paid', 
    'order.forwarded_to_supplier',
    'order.fulfillment_confirmed',
    'order.closed'
  ];
  
  const columns = VISIBLE_COLUMNS.map(statusId => {
      return {
          id: statusId,
          orders: orders.filter(o => o.status === statusId)
      };
  });
  
  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Order") {
      setActiveOrder(event.active.data.current.order);
    }
  }

  function onDragOver() {
      // Intentionally empty
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveOrder(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeOrderIndex = orders.findIndex(o => o.id === activeId);
    if (activeOrderIndex === -1) return;
    
    const currentOrder = orders[activeOrderIndex];
    
    const isOverColumn = VISIBLE_COLUMNS.includes(overId as OrderStatus);
    
    let newStatus = "";
    
    if (isOverColumn) {
        newStatus = overId;
    } else {
        const overOrder = orders.find(o => o.id === overId);
        if (overOrder) {
            newStatus = overOrder.status;
        }
    }

    if (!newStatus || newStatus === currentOrder.status) return;

    const oldOrders = [...orders];
    setOrders(orders.map(o => 
        o.id === activeId ? { ...o, status: newStatus } : o
    ));

    try {
        await updateOrderStatus(activeId, newStatus);
        toast.success("Zmieniono status zamówienia");
        router.refresh();
    } catch {
        toast.error("Wystąpił błąd podczas zmiany statusu");
        setOrders(oldOrders);
    }
  }

  if (!mounted) return null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="h-[calc(100vh-14rem)] flex gap-4 overflow-x-auto pb-4 snap-x ml-4 md:ml-0">
        {columns.map((col) => (
          <div key={col.id} className="w-[280px] md:w-[320px] shrink-0 snap-center h-full">
            <OrdersPipelineColumn
              statusId={col.id}
              orders={col.orders}
            />
          </div>
        ))}
      </div>

      {createPortal(
        <DragOverlay>
          {activeOrder && (
            <OrdersPipelineCard order={activeOrder} />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
