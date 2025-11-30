"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { TaskCard, type TaskType } from "./task-card";
import { useMemo, useState } from "react";
import { createTask, deleteColumn, updateColumnTitle } from "../actions";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export interface ColumnType {
    id: string;
    title: string;
    orderIndex: number;
    tasks: TaskType[];
}

interface ColumnProps {
    column: ColumnType;
    isOverlay?: boolean;
}

export function Column({ column, isOverlay }: ColumnProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(column.title);
    const [newTaskContent, setNewTaskContent] = useState("");
    const [isAddingTask, setIsAddingTask] = useState(false);

    const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
        disabled: isEditingTitle || isAddingTask,
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const handleTitleSubmit = async () => {
        setIsEditingTitle(false);
        if (title !== column.title) {
            try {
                await updateColumnTitle(column.id, title);
            } catch {
                toast.error("Błąd zmiany nazwy");
                setTitle(column.title);
            }
        }
    };

    const handleDeleteColumn = async () => {
        try {
            await deleteColumn(column.id);
            toast.success("Usunięto kolumnę");
        } catch {
            toast.error("Błąd usuwania kolumny");
        }
    };

    const handleAddTask = async () => {
        if (!newTaskContent.trim()) {
            setIsAddingTask(false);
            return;
        }
        try {
            await createTask(column.id, newTaskContent);
            setNewTaskContent("");
            setIsAddingTask(false);
            toast.success("Dodano zadanie");
        } catch {
            toast.error("Błąd dodawania zadania");
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-muted/50 w-[300px] h-[500px] rounded-xl border-2 border-dashed border-primary/50 opacity-50 flex-shrink-0"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-[300px] flex-shrink-0 h-full max-h-full flex flex-col bg-muted/30 rounded-xl border"
        >
            <div
                {...attributes}
                {...listeners}
                className="p-4 font-medium flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
                {isEditingTitle ? (
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleTitleSubmit();
                        }}
                        autoFocus
                        className="h-8"
                    />
                ) : (
                    <span 
                        className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {column.title}
                    </span>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                            Zmień nazwę
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteColumn} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Usuń kolumnę
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[100px]">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {column.tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>

            <div className="p-3 border-t bg-background/50 rounded-b-xl">
                {isAddingTask ? (
                    <div className="space-y-2">
                        <Input
                            placeholder="Treść zadania..."
                            value={newTaskContent}
                            onChange={(e) => setNewTaskContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddTask();
                                if (e.key === "Escape") setIsAddingTask(false);
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>Anuluj</Button>
                            <Button size="sm" onClick={handleAddTask}>Dodaj</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                        onClick={() => setIsAddingTask(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj zadanie
                    </Button>
                )}
            </div>
        </div>
    );
}
