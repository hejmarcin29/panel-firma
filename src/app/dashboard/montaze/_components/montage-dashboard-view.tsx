"use client";

import { useState } from "react";
import { LayoutGrid, List, Calendar as CalendarIcon, CheckSquare } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MontagePipelineBoard } from "./montage-pipeline-board";
import type { Montage, StatusOption } from "../types";

interface MontageDashboardViewProps {
  montages: Montage[];
  statusOptions: StatusOption[];
  headerAction?: React.ReactNode;
}

export function MontageDashboardView({ montages, statusOptions, headerAction }: MontageDashboardViewProps) {
  const [view, setView] = useState<"board" | "list" | "calendar">("board");

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 md:hidden border-b bg-background">
         <h1 className="text-lg font-semibold">Centrum Montaży</h1>
         {headerAction}
      </div>

      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list" | "calendar")} className="w-auto">
                <TabsList>
                    <TabsTrigger value="board">
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Tablica
                    </TabsTrigger>
                    <TabsTrigger value="list">
                        <List className="mr-2 h-4 w-4" />
                        Lista
                    </TabsTrigger>
                    <TabsTrigger value="calendar" disabled className="hidden sm:inline-flex">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Kalendarz
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        {headerAction && <div className="hidden md:block shrink-0">{headerAction}</div>}
      </div>

      <div className="flex-1 overflow-auto">
        {view === "board" && (
            <MontagePipelineBoard montages={montages} statusOptions={statusOptions} />
        )}
        {view === "list" && (
            <div className="p-4 sm:p-6">
                <div className="rounded-md border bg-card">
                    <div className="grid grid-cols-1 divide-y">
                        {montages.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground">Brak montaży</div>
                        )}
                        {montages.map(montage => {
                            const pendingTasks = montage.tasks.filter(t => !t.completed).length;
                            return (
                                <div key={montage.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {montage.clientName}
                                            {montage.displayId && (
                                                <span className="text-xs text-muted-foreground font-normal">({montage.displayId})</span>
                                            )}
                                            {pendingTasks > 0 && (
                                                <span className="inline-flex items-center rounded-full border border-transparent bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground shadow transition-colors hover:bg-destructive/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                                    <CheckSquare className="mr-1 h-3 w-3" />
                                                    {pendingTasks}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {montage.installationCity || "Brak lokalizacji"} • {montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).toLocaleDateString() : "Nie zaplanowano"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm font-medium px-2 py-1 rounded-full bg-muted">
                                            {statusOptions.find(s => s.value === montage.status)?.label}
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/montaze/${montage.id}`}>Szczegóły</Link>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
