"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckSquare, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

interface TaskItem {
    id: string;
    clientName: string;
    installationCity: string | null;
    scheduledInstallationAt: Date | number | string | null;
    displayId: string | null;
    pendingTasksCount: number;
}

interface TasksWidgetProps {
  tasksMontages: TaskItem[];
}

export function TasksWidget({ tasksMontages }: TasksWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Zadania do wykonania</CardTitle>
        <CardDescription>Montaże z oczekującymi zadaniami</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {tasksMontages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Wszystkie zadania wykonane!</p>
          ) : (
            <div className="space-y-4">
              {tasksMontages.map((montage) => (
                <Link 
                    key={montage.id} 
                    href={`/dashboard/montaze/${montage.id}?tab=tasks`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-medium text-xs">
                        {montage.displayId || 'M'}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{montage.clientName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {montage.installationCity || "Brak adresu"}
                            </span>
                            <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).toLocaleDateString() : 'Brak daty'}
                            </span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-transparent bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        {montage.pendingTasksCount} zad.
                      </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
