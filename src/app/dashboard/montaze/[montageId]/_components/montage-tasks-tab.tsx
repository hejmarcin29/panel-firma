"use client";

import { CheckSquare, Square, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addMontageTask, toggleMontageTask } from "../../actions";
import type { Montage } from "../../types";

export function MontageTasksTab({ montage }: { montage: Montage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newTask, setNewTask] = useState("");

  const handleToggle = (taskId: string, completed: boolean) => {
    startTransition(async () => {
      await toggleMontageTask({ montageId: montage.id, taskId, completed });
      router.refresh();
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    startTransition(async () => {
      await addMontageTask({ montageId: montage.id, title: newTask });
      setNewTask("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 py-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Dodaj nowe zadanie..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !newTask.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj
        </Button>
      </form>

      <div className="space-y-2">
        {montage.tasks.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
                Brak zadań. Dodaj pierwsze zadanie powyżej.
            </div>
        )}
        {montage.tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              task.completed ? "bg-muted/50" : "bg-card"
            )}
          >
            <button
              onClick={() => handleToggle(task.id, !task.completed)}
              disabled={pending}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                task.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground hover:bg-muted"
              )}
            >
              {task.completed && <CheckSquare className="h-3.5 w-3.5" />}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                task.completed && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
