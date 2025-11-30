"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Column, type ColumnType } from "./column";
import { TaskCard, type TaskType } from "./task-card";
import { createColumn, reorderColumns, reorderTasks } from "../actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BoardProps {
    initialColumns: ColumnType[];
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

export function Board({ initialColumns }: BoardProps) {
    const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
    const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
    const [activeTask, setActiveTask] = useState<TaskType | null>(null);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // 3px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCreateColumn = async () => {
        if (!newColumnTitle.trim()) return;
        try {
            await createColumn(newColumnTitle);
            setNewColumnTitle("");
            setIsDialogOpen(false);
            toast.success("Dodano kolumnę");
        } catch {
            toast.error("Błąd dodawania kolumny");
        }
    };

    function findColumn(id: string) {
        return columns.find((c) => c.id === id);
    }

    function findTask(id: string) {
        for (const column of columns) {
            const task = column.tasks.find((t) => t.id === id);
            if (task) return task;
        }
        return null;
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as string;

        if (active.data.current?.type === "Column") {
            setActiveColumn(findColumn(id) || null);
            return;
        }

        if (active.data.current?.type === "Task") {
            setActiveTask(findTask(id) || null);
            return;
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverTask = over.data.current?.type === "Task";

        if (!isActiveTask) return;

        // Dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            setColumns((columns) => {
                const activeColumnIndex = columns.findIndex((col) =>
                    col.tasks.some((task) => task.id === activeId)
                );
                const overColumnIndex = columns.findIndex((col) =>
                    col.tasks.some((task) => task.id === overId)
                );

                if (activeColumnIndex === -1 || overColumnIndex === -1) return columns;

                const activeColumn = columns[activeColumnIndex];
                const overColumn = columns[overColumnIndex];

                const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
                const overTaskIndex = overColumn.tasks.findIndex((t) => t.id === overId);

                if (activeColumnIndex === overColumnIndex) {
                    // Same column reorder
                    const newTasks = arrayMove(activeColumn.tasks, activeTaskIndex, overTaskIndex);
                    const newColumns = [...columns];
                    newColumns[activeColumnIndex] = { ...activeColumn, tasks: newTasks };
                    return newColumns;
                } else {
                    // Different column
                    const newActiveTasks = [...activeColumn.tasks];
                    const [movedTask] = newActiveTasks.splice(activeTaskIndex, 1);
                    
                    const newOverTasks = [...overColumn.tasks];
                    newOverTasks.splice(overTaskIndex, 0, movedTask);
                    
                    // Update task's columnId locally
                    movedTask.columnId = overColumn.id;

                    const newColumns = [...columns];
                    newColumns[activeColumnIndex] = { ...activeColumn, tasks: newActiveTasks };
                    newColumns[overColumnIndex] = { ...overColumn, tasks: newOverTasks };
                    
                    return newColumns;
                }
            });
        }

        // Dropping a Task over a Column
        const isOverColumn = over.data.current?.type === "Column";
        if (isActiveTask && isOverColumn) {
            setColumns((columns) => {
                const activeColumnIndex = columns.findIndex((col) =>
                    col.tasks.some((task) => task.id === activeId)
                );
                const overColumnIndex = columns.findIndex((col) => col.id === overId);

                if (activeColumnIndex === -1 || overColumnIndex === -1) return columns;
                if (activeColumnIndex === overColumnIndex) return columns;

                const activeColumn = columns[activeColumnIndex];
                const overColumn = columns[overColumnIndex];
                const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);

                const newActiveTasks = [...activeColumn.tasks];
                const [movedTask] = newActiveTasks.splice(activeTaskIndex, 1);
                
                // Update task's columnId locally
                movedTask.columnId = overColumn.id;

                const newOverTasks = [...overColumn.tasks];
                newOverTasks.push(movedTask);

                const newColumns = [...columns];
                newColumns[activeColumnIndex] = { ...activeColumn, tasks: newActiveTasks };
                newColumns[overColumnIndex] = { ...overColumn, tasks: newOverTasks };

                return newColumns;
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === "Column";
        if (isActiveColumn) {
            setColumns((columns) => {
                const activeIndex = columns.findIndex((col) => col.id === activeId);
                const overIndex = columns.findIndex((col) => col.id === overId);
                const newColumns = arrayMove(columns, activeIndex, overIndex);
                
                // Persist column order
                const updates = newColumns.map((col, index) => ({
                    id: col.id,
                    orderIndex: index
                }));
                reorderColumns(updates);

                return newColumns;
            });
            return;
        }

        // Task handling
        setColumns((columns) => {
            const activeColumn = columns.find(col => col.tasks.some(t => t.id === activeId));
            const overColumn = columns.find(col => col.tasks.some(t => t.id === overId));
            
            // If dropped over a column container (empty column or just the container)
            if (!overColumn) {
                const overCol = columns.find(col => col.id === overId);
                if (overCol && activeColumn && activeColumn.id === overCol.id) {
                     // Dropped in same column but over the container?
                     // Usually means dropped at end or empty.
                     // handleDragOver handles the move.
                     // We just persist.
                     const updates = activeColumn.tasks.map((t, i) => ({
                        id: t.id,
                        orderIndex: i,
                        columnId: activeColumn.id
                    }));
                    reorderTasks(updates);
                    return columns;
                }
                return columns;
            }

            if (!activeColumn) return columns;

            // If active and over are in different columns, handleDragOver didn't finish?
            if (activeColumn.id !== overColumn.id) {
                return columns;
            }

            // Same column
            const activeIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
            const overIndex = activeColumn.tasks.findIndex(t => t.id === overId);

            const newColumns = [...columns];
            const columnIndex = columns.findIndex(c => c.id === activeColumn.id);

            if (activeIndex !== overIndex) {
                const newTasks = arrayMove(activeColumn.tasks, activeIndex, overIndex);
                newColumns[columnIndex] = { ...activeColumn, tasks: newTasks };
                
                const updates = newTasks.map((t, i) => ({
                    id: t.id,
                    orderIndex: i,
                    columnId: activeColumn.id
                }));
                reorderTasks(updates);
            } else {
                // Even if indices are same, we should persist if it was a cross-column move
                // to ensure the new columnId is saved.
                const originalColumnId = active.data.current?.task?.columnId;
                if (originalColumnId !== activeColumn.id) {
                     const updates = activeColumn.tasks.map((t, i) => ({
                        id: t.id,
                        orderIndex: i,
                        columnId: activeColumn.id
                    }));
                    reorderTasks(updates);
                }
            }

            return newColumns;
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex flex-col gap-1">
                    {/* Header content handled in page.tsx */}
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nowa Tablica
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Dodaj nową kolumnę</DialogTitle>
                            <DialogDescription>
                                Np. &quot;Biuro&quot;, &quot;YouTube&quot;, &quot;Zakupy&quot;.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Nazwa
                                </Label>
                                <Input
                                    id="name"
                                    value={newColumnTitle}
                                    onChange={(e) => setNewColumnTitle(e.target.value)}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateColumn}>Dodaj</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 h-full overflow-x-auto pb-4 items-start">
                    <SortableContext
                        items={columns.map((col) => col.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {columns.map((col) => (
                            <Column key={col.id} column={col} />
                        ))}
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeColumn && (
                        <Column column={activeColumn} isOverlay />
                    )}
                    {activeTask && (
                        <TaskCard task={activeTask} isOverlay />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
