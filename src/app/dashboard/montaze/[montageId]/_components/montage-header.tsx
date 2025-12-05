"use client";

import { ArrowLeft, Phone, Navigation } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Montage, StatusOption } from "../../types";
import { updateMontageStatus } from "../../actions";
import { useIsMobile } from "@/hooks/use-mobile";
import { type UserRole } from '@/lib/db/schema';

interface MontageHeaderProps {
  montage: Montage;
  statusOptions: StatusOption[];
  userRole?: UserRole;
}

export function MontageHeader({ montage, statusOptions, userRole = 'admin' }: MontageHeaderProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();

  const handleStatusChange = (value: string) => {
    startTransition(async () => {
      await updateMontageStatus({ montageId: montage.id, status: value });
      router.refresh();
    });
  };

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            asChild
          >
            <Link href="/dashboard/montaze">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Wróć</span>
            </Link>
          </Button>
          <div className="flex flex-col overflow-hidden">
            <h1 className="truncate text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              {montage.clientName}
              {montage.displayId && (
                  <span className="text-sm font-normal text-muted-foreground">({montage.displayId})</span>
              )}
            </h1>
            <span className="truncate text-sm text-muted-foreground">
              {montage.installationCity || "Brak lokalizacji"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMobile ? (
             <div className="flex gap-1">
                {montage.contactPhone && (
                    <Button size="icon" variant="outline" asChild>
                        <a href={`tel:${montage.contactPhone}`}>
                            <Phone className="h-4 w-4" />
                        </a>
                    </Button>
                )}
                 {montage.installationAddress && (
                    <Button size="icon" variant="outline" asChild>
                         <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                montage.installationAddress + (montage.installationCity ? `, ${montage.installationCity}` : "")
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Navigation className="h-4 w-4" />
                        </a>
                    </Button>
                )}
             </div>
          ) : (
            <Select
                value={montage.status}
                onValueChange={handleStatusChange}
                disabled={pending}
            >
                <SelectTrigger className={cn("w-[180px]", pending && "opacity-50")}>
                <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                        <div
                        className={cn(
                            "h-2 w-2 rounded-full",
                            option.value === "before_final_invoice" ? "bg-green-500" :
                            option.value === "before_installation" ? "bg-blue-500" :
                            option.value === "before_first_payment" ? "bg-yellow-500" :
                            option.value === "before_measurement" ? "bg-orange-500" :
                            "bg-slate-300"
                        )}
                        />
                        {option.label}
                    </div>
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {isMobile && (
         <Select
            value={montage.status}
            onValueChange={handleStatusChange}
            disabled={pending}
        >
            <SelectTrigger className={cn("w-full", pending && "opacity-50")}>
            <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
            {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                {option.label}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
      )}
    </div>
  );
}
