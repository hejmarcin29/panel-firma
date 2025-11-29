"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import type { Montage } from "../montaze/types";

interface RecentActivityProps {
  recentMontages: Montage[];
}

function initials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function RecentActivity({ recentMontages }: RecentActivityProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ostatnia Aktywność</CardTitle>
        <CardDescription>Ostatnio aktualizowane montaże</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentMontages.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-8">Brak ostatniej aktywności.</p>
          ) : (
            recentMontages.map((montage) => (
                <div key={montage.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(montage.clientName)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{montage.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                    {montage.displayId ? `Montaż ${montage.displayId}` : 'Montaż'} • {montage.status}
                    </p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">
                    {montage.updatedAt ? new Date(montage.updatedAt).toLocaleDateString() : ''}
                </div>
                </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
