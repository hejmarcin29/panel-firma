"use client";

import { type CSSProperties, useEffect, useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Montage, StatusOption, AlertSettings } from "../types";
import { MontagePipelineCard } from "./montage-pipeline-card";
import { updateMontageStatus } from "../actions";
import type { MontageStatus } from "@/lib/db/schema";

function buildBoard(statusOptions: StatusOption[], montages: Montage[]) {
  const board: Record<MontageStatus, Montage[]> = Object.fromEntries(
    statusOptions.map((status) => [status.value, [] as Montage[]])
  ) as Record<MontageStatus, Montage[]>;

  for (const montage of montages) {
    if (!board[montage.status]) {
      board[montage.status as MontageStatus] = [];
    }

    board[montage.status as MontageStatus].push(montage);
  }

  return board;
}

function findMontageById(board: Record<MontageStatus, Montage[]>, id: string) {
  for (const column of Object.values(board)) {
    const match = column.find((item) => item.id === id);
    if (match) {
      return match;
    }
  }
  return null;
}

function cloneBoard(board: Record<MontageStatus, Montage[]>) {
  const next: Record<MontageStatus, Montage[]> = {} as Record<MontageStatus, Montage[]>;

  for (const [status, items] of Object.entries(board) as [MontageStatus, Montage[]][]) {
    next[status] = items.map((item) => ({
      ...item,
      notes: item.notes.map((note) => ({ ...note })),
      attachments: item.attachments.map((attachment) => ({ ...attachment })),
      tasks: item.tasks.map((task) => ({ ...task })),
    }));
  }

  return next;
}

function DraggableMontageCard({
  montage,
  statusOptions,
  status,
  disabled,
  threatDays,
  alertSettings,
}: {
  montage: Montage;
  statusOptions: StatusOption[];
  status: MontageStatus;
  disabled: boolean;
  threatDays: number;
  alertSettings: AlertSettings;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: montage.id,
    data: { status },
    disabled,
  });

  const style: CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging ? "z-50 opacity-75" : "opacity-100"
      )}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
    >
      <MontagePipelineCard montage={montage} statusOptions={statusOptions} threatDays={threatDays} alertSettings={alertSettings} />
    </div>
  );
}

function PipelineColumn({
  status,
  items,
  statusOptions,
  isPending,
  threatDays,
  alertSettings,
}: {
  status: StatusOption;
  items: Montage[];
  statusOptions: StatusOption[];
  isPending: boolean;
  threatDays: number;
  alertSettings: AlertSettings;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
    data: { status: status.value },
  });

  return (
    <div
      ref={setNodeRef}
      data-status={status.value}
      className={cn(
        "min-w-[85vw] sm:min-w-[350px] md:min-w-[300px] xl:min-w-[280px] snap-center snap-always shrink-0",
        "transition",
        isOver && "scale-[1.01]"
      )}
    >
      <Card
        className={cn(
          "h-full border border-border/70 bg-muted/20",
          "flex flex-col",
          isOver && "border-primary bg-primary/10 shadow-sm",
          isPending && "pointer-events-none opacity-60"
        )}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">{status.label}</CardTitle>
            <Badge
              variant="secondary"
              className="rounded-full text-[11px] uppercase tracking-wide"
            >
              {items.length}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {status.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-6">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Brak montaży w tym etapie.</p>
          ) : (
            items.map((montage) => (
              <DraggableMontageCard
                key={montage.id}
                montage={montage}
                status={status.value}
                statusOptions={statusOptions}
                disabled={isPending}
                threatDays={threatDays}
                alertSettings={alertSettings}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type MontagePipelineBoardProps = {
  montages: Montage[];
  statusOptions: StatusOption[];
  threatDays: number;
  alertSettings: AlertSettings;
};

export function MontagePipelineBoard({ montages, statusOptions, threatDays, alertSettings }: MontagePipelineBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeStatus, setActiveStatus] = useState<string>(statusOptions[0]?.value);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const children = Array.from(container.children) as HTMLElement[];
    
    let maxVisibleWidth = 0;
    let currentActive = activeStatus;

    for (const child of children) {
        if (!child.getAttribute('data-status')) continue;
        
        const childRect = child.getBoundingClientRect();
        
        const visibleLeft = Math.max(containerRect.left, childRect.left);
        const visibleRight = Math.min(containerRect.right, childRect.right);
        
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        
        if (visibleWidth > maxVisibleWidth) {
            maxVisibleWidth = visibleWidth;
            const status = child.getAttribute('data-status');
            if (status) currentActive = status;
        }
    }
    
    if (currentActive !== activeStatus) {
        setActiveStatus(currentActive);
    }
  };

  const scrollToColumn = (status: string) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const child = Array.from(container.children).find(c => c.getAttribute('data-status') === status) as HTMLElement;
      if (child) {
          child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          // Optimistically set active status
          setActiveStatus(status);
      }
  };


  const canonicalBoard = useMemo(() => buildBoard(statusOptions, montages), [statusOptions, montages]);
  const [board, setBoard] = useState<Record<MontageStatus, Montage[]>>(() => cloneBoard(canonicalBoard));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBoard(cloneBoard(canonicalBoard));
  }, [canonicalBoard]);

  const activeMontage = activeId ? findMontageById(board, activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setError(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const sourceStatus = active.data.current?.status as MontageStatus | undefined;
    const targetStatus = over.data.current?.status as MontageStatus | undefined;

    if (!sourceStatus || !targetStatus || sourceStatus === targetStatus) {
      return;
    }

    const movingMontage = findMontageById(board, String(active.id));

    if (!movingMontage) {
      return;
    }

    const nextBoard = cloneBoard(board);

    nextBoard[sourceStatus] = nextBoard[sourceStatus].filter((item) => item.id !== movingMontage.id);
    nextBoard[targetStatus] = [
      { ...movingMontage, status: targetStatus },
      ...nextBoard[targetStatus],
    ];

    setBoard(nextBoard);

    startTransition(async () => {
      try {
        await updateMontageStatus({ montageId: movingMontage.id, status: targetStatus });
        router.refresh();
      } catch (updateError) {
        console.error(updateError);
        setBoard(cloneBoard(canonicalBoard));
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Nie udalo sie zaktualizowac statusu."
        );
      }
    });
  };

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {/* Mobile Status Nav */}
      <div className="flex md:hidden overflow-x-auto gap-2 pb-2 px-4 scrollbar-hide snap-x">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            onClick={() => scrollToColumn(status.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all snap-start border",
              activeStatus === status.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveId(null)}
      >
        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-6 scrollbar-hide" 
            style={{ scrollbarWidth: 'none' }}
        >
          {statusOptions.map((status) => (
            <PipelineColumn
              key={status.value}
              status={status}
              items={board[status.value] ?? []}
              statusOptions={statusOptions}
              isPending={isPending}
              threatDays={threatDays}
              alertSettings={alertSettings}
            />
          ))}
        </div>
        <DragOverlay>
          {activeMontage ? (
            <div className="w-[280px]">
              <MontagePipelineCard montage={activeMontage} statusOptions={statusOptions} threatDays={threatDays} alertSettings={alertSettings} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
