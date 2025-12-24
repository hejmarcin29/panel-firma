"use client";

import { ArrowLeft, Phone, Navigation, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Montage, StatusOption } from "../../types";
import { updateMontageStatus, deleteMontage } from "../../actions";
import { useIsMobile } from "@/hooks/use-mobile";
import { type UserRole } from '@/lib/db/schema';
import { ProtocolWizard } from './protocol/protocol-wizard';

interface MontageHeaderProps {
  montage: Montage;
  statusOptions: StatusOption[];
  userRoles?: UserRole[];
}

export function MontageHeader({ montage, statusOptions, userRoles = ['admin'] }: MontageHeaderProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [pending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = (value: string) => {
    startTransition(async () => {
      await updateMontageStatus({ montageId: montage.id, status: value });
      router.refresh();
    });
  };

  const handleDelete = async () => {
      setIsDeleting(true);
      try {
          await deleteMontage(montage.id);
          toast.success("Montaż został przeniesiony do kosza");
          router.push("/dashboard/crm/montaze");
      } catch (error) {
          toast.error("Wystąpił błąd podczas usuwania montażu");
          console.error(error);
      } finally {
          setIsDeleting(false);
          setShowDeleteDialog(false);
      }
  };

  const canEditStatus = userRoles.includes('admin') || userRoles.includes('installer');
  const canDelete = userRoles.includes('admin');
  const showProtocolButton = (userRoles.includes('installer') || userRoles.includes('admin')) && 
                             montage.status !== 'lead';

  const acceptedQuote = montage.quotes?.find(q => q.status === 'accepted') || montage.quotes?.[0];
  // If there is a quote, check if any item has 8% VAT. If so, it's likely housing.
  // If all items are 23%, it's likely commercial.
  // If no quote, default to true (housing).
  const defaultIsHousingVat = acceptedQuote 
      ? acceptedQuote.items.some(i => i.vatRate === 8) 
      : true;

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 min-w-0 items-center gap-2 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Wróć</span>
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
          {isMobile && (
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
          )}

            <Select
                value={montage.status}
                onValueChange={handleStatusChange}
                disabled={pending || !canEditStatus}
            >
                <SelectTrigger className={cn("w-[180px] hidden sm:flex", isMobile && "w-[140px] flex", (pending || !canEditStatus) && "opacity-50")}>
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

          {canDelete && (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Usuń montaż
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Czy na pewno chcesz usunąć ten montaż?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Montaż zostanie przeniesiony do kosza. Będziesz mógł go przywrócić przez 365 dni w ustawieniach.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Usuwanie..." : "Usuń"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
