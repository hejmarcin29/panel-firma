"use client";

import { CheckSquare, Plus, Paperclip, FileIcon } from "lucide-react";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addMontageTask, toggleMontageTask, addMontageAttachment } from "../../actions";
import type { Montage } from "../../types";

export function MontageTasksTab({ montage }: { montage: Montage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newTask, setNewTask] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachingTaskId, setAttachingTaskId] = useState<string | null>(null);

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

  const handleAttachClick = (taskId: string) => {
    setAttachingTaskId(taskId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachingTaskId) return;

    const formData = new FormData();
    formData.append("montageId", montage.id);
    formData.append("taskId", attachingTaskId);
    formData.append("file", file);
    formData.append("title", file.name);

    startTransition(async () => {
        try {
            await addMontageAttachment(formData);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Błąd przesyłania pliku");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        setAttachingTaskId(null);
    });
  };

  return (
    <div className="space-y-4 py-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
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
              "flex items-start gap-3 rounded-lg border p-3 transition-colors",
              task.completed ? "bg-muted/50" : "bg-card"
            )}
          >
            <button
              onClick={() => handleToggle(task.id, !task.completed)}
              disabled={pending}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                task.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground hover:bg-muted"
              )}
            >
              {task.completed && <CheckSquare className="h-3.5 w-3.5" />}
            </button>
            
            <div className="flex flex-col flex-1 gap-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span
                    className={cn(
                        "text-sm break-all",
                        task.completed && "text-muted-foreground line-through"
                    )}
                    >
                    {task.title}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" 
                        onClick={() => handleAttachClick(task.id)}
                        title="Dodaj załącznik"
                    >
                        <Paperclip className="h-3.5 w-3.5" />
                    </Button>
                </div>
                
                {task.attachments && task.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {task.attachments.map(att => (
                            <a 
                                key={att.id} 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 border transition-colors max-w-full"
                            >
                                <FileIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{att.title || "Załącznik"}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
