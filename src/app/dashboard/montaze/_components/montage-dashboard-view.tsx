"use client";

import { useState } from "react";
import { LayoutGrid, List, Calendar as CalendarIcon, CheckSquare } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MontagePipelineBoard } from "./montage-pipeline-board";
import type { Montage, StatusOption } from "../types";

interface MontageDashboardViewProps {
  montages: Montage[];
  statusOptions: StatusOption[];
  headerAction?: React.ReactNode;
  threatDays: number;
}

export function MontageDashboardView({ montages, statusOptions, headerAction, threatDays }: MontageDashboardViewProps) {
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
            <MontagePipelineBoard montages={montages} statusOptions={statusOptions} threatDays={threatDays} />
        )}
        {view === "list" && (
            <div className="p-4 sm:p-6">
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Klient / ID</TableHead>
                                <TableHead className="hidden md:table-cell">Lokalizacja</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="hidden md:table-cell text-center">Zadania</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {montages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Brak montaży
                                    </TableCell>
                                </TableRow>
                            ) : (
                                montages.map(montage => {
                                    const pendingTasks = montage.tasks.filter(t => !t.completed).length;
                                    const statusLabel = statusOptions.find(s => s.value === montage.status)?.label;
                                    
                                    return (
                                        <TableRow key={montage.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <Link href={`/dashboard/montaze/${montage.id}`} className="hover:underline">
                                                        {montage.clientName}
                                                    </Link>
                                                    {montage.displayId && (
                                                        <span className="text-xs text-muted-foreground">{montage.displayId}</span>
                                                    )}
                                                    {/* Mobile location */}
                                                    <span className="md:hidden text-xs text-muted-foreground mt-1">
                                                        {montage.installationCity || "Brak lokalizacji"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {montage.installationCity || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    {montage.scheduledInstallationAt ? (
                                                        <span>{new Date(montage.scheduledInstallationAt).toLocaleDateString()}</span>
                                                    ) : (
                                                        montage.forecastedInstallationDate ? (
                                                            <span className="italic text-muted-foreground">Szac: {new Date(montage.forecastedInstallationDate).toLocaleDateString()}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-center">
                                                {pendingTasks > 0 ? (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {pendingTasks} do zrobienia
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-muted font-normal">
                                                    {statusLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/montaze/${montage.id}`}>Szczegóły</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
