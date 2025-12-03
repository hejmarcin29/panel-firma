"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Bell, Calendar, Wrench, ListTodo } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TasksWidgetProps {
  tasksCount: number;
  urgentCount: number;
  todoCount?: number;
  reminderTasks?: { id: string; content: string; reminderAt: Date | null; dueDate: Date | null }[];
}

export function TasksWidget({ tasksCount, urgentCount, todoCount = 0, reminderTasks = [] }: TasksWidgetProps) {
    return (
        <Card className="h-full flex flex-col justify-center">
            <CardContent className="p-6 flex flex-col items-center text-center gap-6">
                
                <div className="space-y-1 w-full">
                    <h3 className="font-semibold text-lg">
                        {urgentCount > 0 
                            ? `Masz ${urgentCount} pilnych zadań` 
                            : (tasksCount + todoCount) > 0 
                                ? "Masz zadania do wykonania" 
                                : "Wszystko zrobione!"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Wybierz kategorię, aby przejść do listy.
                    </p>
                </div>

                {/* Segmented Control / Big Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Link 
                        href="/dashboard/zadania" 
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-accent/50",
                            urgentCount > 0 ? "border-destructive/20 bg-destructive/5 hover:bg-destructive/10" : "border-muted bg-card"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-full",
                            urgentCount > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}>
                            <Wrench className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">Montaże</span>
                            <span className="text-xs text-muted-foreground">{tasksCount} zadań</span>
                        </div>
                    </Link>

                    <Link 
                        href="/dashboard/todo" 
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-muted bg-card transition-all hover:bg-accent/50"
                    >
                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-600">
                            <ListTodo className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">To Do</span>
                            <span className="text-xs text-muted-foreground">{todoCount} zadań</span>
                        </div>
                    </Link>
                </div>

                {reminderTasks.length > 0 && (
                    <div className="flex flex-col gap-2 w-full text-left bg-muted/30 p-3 rounded-md border border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Bell className="h-3 w-3" />
                            Wymagające uwagi
                        </span>
                        {reminderTasks.slice(0, 3).map(task => (
                            <Link key={task.id} href="/dashboard/todo" className="flex items-start gap-2 text-sm hover:underline group">
                                {task.reminderAt && <Bell className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 group-hover:text-orange-600" />}
                                {task.dueDate && !task.reminderAt && <Calendar className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5 group-hover:text-red-600" />}
                                <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">{task.content}</span>
                            </Link>
                        ))}
                        {reminderTasks.length > 3 && (
                            <span className="text-xs text-muted-foreground text-center pt-1">+ {reminderTasks.length - 3} więcej</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

