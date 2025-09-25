import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Wrench, Truck, Clock, CalendarDays } from "lucide-react";

export function TypeBadge({ type }: { type: string }) {
  const isInstall = type === "installation";
  return (
    <Badge size="xs" variant="neutral">
      <span className="inline-flex items-center gap-1.5">
        {isInstall ? <Wrench className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
        {isInstall ? "Montaż" : "Dostawa"}
      </span>
    </Badge>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  // Mapujemy status → ikona + wariant koloru
  let icon: React.ReactNode = null;
  let variant: "neutral" | "success" | "warning" | "destructive" = "neutral";
  switch (status) {
    case "awaiting_measurement":
      icon = <Clock className="h-3.5 w-3.5" />;
      variant = "warning";
      break;
    case "ready_to_schedule":
      icon = <CalendarDays className="h-3.5 w-3.5" />;
      variant = "warning";
      break;
    case "scheduled":
      icon = <CalendarDays className="h-3.5 w-3.5" />;
      variant = "neutral";
      break;
    case "completed":
      icon = <CheckCircle2 className="h-3.5 w-3.5" />;
      variant = "success";
      break;
    case "cancelled":
      icon = <XCircle className="h-3.5 w-3.5" />;
      variant = "destructive";
      break;
    default:
      variant = "neutral";
  }
  return (
    <Badge size="xs" variant={variant}>
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </Badge>
  );
}

export function OutcomeBadge({ outcome }: { outcome: "won" | "lost" | null | undefined }) {
  if (!outcome) return <span className="opacity-40">—</span>;
  const isWon = outcome === "won";
  return (
    <Badge size="xs" variant={isWon ? "success" : "destructive"}>
      <span className="inline-flex items-center gap-1.5">
        {isWon ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {isWon ? "Wygrane" : "Przegrane"}
      </span>
    </Badge>
  );
}
