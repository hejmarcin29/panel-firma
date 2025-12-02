"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface TasksWidgetProps {
  tasksCount: number;
  urgentCount: number;
  todoCount?: number;
}

export function TasksWidget({ tasksCount, urgentCount, todoCount = 0 }: TasksWidgetProps) {
    return (
        <Card className="h-full flex flex-col justify-center">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="flex gap-4 justify-center w-full">
                    {/* Montage Tasks Icon */}
                    <Link href="/dashboard/zadania" className="relative group cursor-pointer">
                        {urgentCount > 0 ? (
                            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-pulse group-hover:bg-destructive/20 transition-colors">
                                <AlertCircle className="h-7 w-7" />
                            </div>
                        ) : (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                        )}
                        {tasksCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold border-2 border-background">
                                {tasksCount}
                            </span>
                        )}
                    </Link>

                    {/* Personal Todo Icon */}
                    {todoCount > 0 && (
                        <Link href="/dashboard/todo" className="relative group cursor-pointer">
                            <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold border-2 border-background">
                                {todoCount}
                            </span>
                        </Link>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                        {urgentCount > 0 
                            ? `Masz ${urgentCount} pilnych zadań` 
                            : (tasksCount + todoCount) > 0 
                                ? "Masz zadania do wykonania" 
                                : "Wszystko zrobione!"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {tasksCount > 0 && `Montaże: ${tasksCount}. `}
                        {todoCount > 0 && `To Do: ${todoCount}.`}
                        {tasksCount === 0 && todoCount === 0 && "Możesz odpocząć, brak zaległości."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                    <Button asChild variant={urgentCount > 0 ? "destructive" : "default"} className="w-full">
                        <Link href="/dashboard/zadania">
                            Montaże
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/todo">
                            To Do
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

