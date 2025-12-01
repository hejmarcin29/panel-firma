"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteTask, updateTaskContent } from "../actions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export interface TaskType {
    id: string;
    content: string;
    columnId: string;
    orderIndex: number;
}

interface TaskCardProps {
    task: TaskType;
    isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(task.content);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
        disabled: isEditing,
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const handleContentSubmit = async () => {
        setIsEditing(false);
        if (content !== task.content) {
            try {
                await updateTaskContent(task.id, content);
            } catch {
                toast.error("Błąd edycji zadania");
                setContent(task.content);
            }
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteTask(task.id);
            toast.success("Usunięto zadanie");
        } catch {
            toast.error("Błąd usuwania zadania");
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-primary/10 border-2 border-primary border-dashed h-[100px] w-full rounded-lg"
            />
        );
    }

    if (isEditing) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="relative group"
            >
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onBlur={handleContentSubmit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleContentSubmit();
                        }
                    }}
                    autoFocus
                    className="min-h-20 resize-none bg-background"
                />
            </div>
        );
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => setIsEditing(true)}
            className={`
                cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group relative
                ${isOverlay ? "cursor-grabbing rotate-2 shadow-xl" : ""}
            `}
        >
            <CardContent className="p-3 whitespace-pre-wrap text-sm">
                {task.content}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </CardContent>
        </Card>
    );
}
