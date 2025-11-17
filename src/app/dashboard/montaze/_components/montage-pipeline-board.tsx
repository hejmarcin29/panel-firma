"use client";

import { type CSSProperties, useEffect, useMemo, useState, useTransition } from "react";
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

import type { Montage, StatusOption } from "./montage-card";
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
}: {
  montage: Montage;
  statusOptions: StatusOption[];
  status: MontageStatus;
  disabled: boolean;
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
      <MontagePipelineCard montage={montage} statusOptions={statusOptions} />
    </div>
  );
}

function PipelineColumn({
  status,
  items,
  statusOptions,
  isPending,
}: {
  status: StatusOption;
  items: Montage[];
  statusOptions: StatusOption[];
  isPending: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
    data: { status: status.value },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[260px] flex-1 xl:w-[280px]",
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
};

export function MontagePipelineBoard({ montages, statusOptions }: MontagePipelineBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-wrap gap-4 pb-6 xl:flex-nowrap xl:overflow-x-auto">
          {statusOptions.map((status) => (
            <PipelineColumn
              key={status.value}
              status={status}
              items={board[status.value] ?? []}
              statusOptions={statusOptions}
              isPending={isPending}
            />
          ))}
        </div>
        <DragOverlay>
          {activeMontage ? (
            <div className="w-[280px]">
              <MontagePipelineCard montage={activeMontage} statusOptions={statusOptions} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
