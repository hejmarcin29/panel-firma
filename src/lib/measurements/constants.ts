import type { DeliveryTimingType } from "@db/schema";

export type MeasurementStatus = "PENDING" | "PLANNED" | "OVERDUE" | "COMPLETED";

export const measurementStatusLabels: Record<MeasurementStatus, string> = {
  PENDING: "Do potwierdzenia",
  PLANNED: "Zaplanowany",
  OVERDUE: "Po terminie",
  COMPLETED: "Zrealizowany",
};

export const measurementStatusBadgeClasses: Record<MeasurementStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PLANNED: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  OVERDUE: "bg-red-500/10 text-red-600 dark:text-red-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200",
};

export const deliveryTimingLabels: Record<DeliveryTimingType, string> = {
  DAYS_BEFORE: "Liczba dni przed montażem",
  EXACT_DATE: "Konkretny termin dostawy",
};

export const deliveryTimingHints: Partial<Record<DeliveryTimingType, string>> = {
  DAYS_BEFORE: "Podaj ile dni przed montażem należy dostarczyć materiał.",
  EXACT_DATE: "Wybierz konkretną datę dostawy materiałów.",
};

type ResolveStatusInput = {
  scheduledAt: Date | null;
  measuredAt: Date | null;
  now?: Date;
};

export function resolveMeasurementStatus({ scheduledAt, measuredAt, now = new Date() }: ResolveStatusInput): MeasurementStatus {
  if (measuredAt) {
    return "COMPLETED";
  }

  if (scheduledAt) {
    if (scheduledAt.getTime() < now.getTime()) {
      return "OVERDUE";
    }

    return "PLANNED";
  }

  return "PENDING";
}
