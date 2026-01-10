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

  const PIPELINE_COLUMNS = [
    { id: 'order.received', statuses: ['order.received', 'order.pending_proforma'] },
    { id: 'order.proforma_issued', statuses: ['order.proforma_issued'] },
    { id: 'order.paid', statuses: ['order.paid'] }, 
    { id: 'order.forwarded_to_supplier', statuses: ['order.forwarded_to_supplier'] },
    { id: 'order.fulfillment_confirmed', statuses: ['order.fulfillment_confirmed', 'order.final_invoice'] },
  ];
  
  const columns = PIPELINE_COLUMNS.map(col => {
      return {
          id: col.id,
          orders: orders.filter(o => col.statuses.includes(o.status))
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
    
    // Determine target column
    let targetColumn = PIPELINE_COLUMNS.find(col => col.id === overId);
    
    if (!targetColumn) {
        // Check if dropped over a card
        const overOrder = orders.find(o => o.id === overId);
        if (overOrder) {
            targetColumn = PIPELINE_COLUMNS.find(col => col.statuses.includes(overOrder.status));
        }
    }
    
    if (!targetColumn) return;

    let newStatus = targetColumn.id;

    // If order is already within this column (sub-status match), preserve its status
    // This prevents "downgrading" status when reordering within valid sub-statuses
    if (targetColumn.statuses.includes(currentOrder.status)) {
        newStatus = currentOrder.status;
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
      <div className="h-full flex gap-4 overflow-x-auto pb-4 px-4 md:px-0">
        {columns.map((col) => (
          <div key={col.id} className="w-[280px] md:w-[20%] min-w-[280px] shrink-0 h-full">
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
