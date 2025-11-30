"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TasksWidgetProps {
  tasksCount: number;
  urgentCount: number;
}

export function TasksWidget({ tasksCount, urgentCount }: TasksWidgetProps) {
    return (
        <Card className="h-full flex flex-col justify-center">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="relative">
                    {urgentCount > 0 ? (
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                    )}
                    {tasksCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold border-2 border-background">
                            {tasksCount}
                        </span>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                        {urgentCount > 0 
                            ? `Masz ${urgentCount} pilnych zadań` 
                            : tasksCount > 0 
                                ? "Masz zadania do wykonania" 
                                : "Wszystko zrobione!"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {tasksCount > 0 
                            ? `Łącznie ${tasksCount} montaży wymaga Twojej uwagi.` 
                            : "Możesz odpocząć, brak zaległości."}
                    </p>
                </div>

                <Button asChild className="w-full mt-2" variant={urgentCount > 0 ? "destructive" : "default"}>
                    <Link href="/dashboard/zadania">
                        Przejdź do zadań
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

