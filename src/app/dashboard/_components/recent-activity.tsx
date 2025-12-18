"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Montage } from "../montaze/types";
import { motion } from "framer-motion";
import Link from "next/link";

interface RecentActivityProps {
  recentMontages: Montage[];
}

const STATUS_LABELS: Record<string, string> = {
  'lead': 'Lead',
  'before_measurement': 'Przed pomiarem',
  'before_first_payment': 'Przed 1. wpłatą',
  'before_installation': 'Przed montażem',
  'before_final_invoice': 'Przed FV i protokołem',
  'completed': 'Zakończony',
  'cancelled': 'Anulowany',
};

function initials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function RecentActivity({ recentMontages }: RecentActivityProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ostatnia Aktywność</CardTitle>
        <CardDescription>Ostatnio aktualizowane montaże</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="space-y-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {recentMontages.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-8">Brak ostatniej aktywności.</p>
          ) : (
            recentMontages.map((montage) => (
                <motion.div key={montage.id} variants={item}>
                  <Link 
                    href={`/dashboard/crm/montaze/${montage.id}`}
                    className="flex items-center p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(montage.clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{montage.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                        {montage.displayId ? `Montaż ${montage.displayId}` : 'Montaż'} • {STATUS_LABELS[montage.status] || montage.status}
                        </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                        {montage.updatedAt ? new Date(montage.updatedAt).toLocaleDateString() : ''}
                    </div>
                  </Link>
                </motion.div>
            ))
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
