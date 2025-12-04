"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListTodo, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TasksWidgetProps {
  tasksCount: number;
  urgentCount: number;
  todoCount?: number;
  reminderTasks?: { id: string; content: string; reminderAt: Date | null; dueDate: Date | null; priority?: string; createdAt?: Date }[];
}

export function TasksWidget({ reminderTasks = [] }: TasksWidgetProps) {
    return (
        <Card className="bg-card border-border shadow-none h-full">
            <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <ListTodo className="h-5 w-5 text-orange-500" />
                            Priorytety
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">Zadania oznaczone jako pilne lub ważne</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent" asChild>
                        <Link href="/dashboard/todo">Wszystkie</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                        {reminderTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                                <p>Wszystko zrobione!</p>
                            </div>
                        ) : (
                            reminderTasks.map(task => (
                                <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-border/50 hover:border-border transition-colors">
                                    <div className={cn(
                                        "mt-1.5 h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px]",
                                        task.priority === 'urgent' ? "bg-orange-500 shadow-orange-500/50" : "bg-yellow-500 shadow-yellow-500/50"
                                    )} />
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium leading-none text-foreground group-hover:text-primary transition-colors">{task.content}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {task.priority === 'urgent' ? 'PILNE' : 'WAŻNE'} • {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Brak daty'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
