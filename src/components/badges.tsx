"use client";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { defaultPipelineStageLabels } from "@/lib/project-settings";
import {
  CheckCircle2,
  XCircle,
  Wrench,
  Truck,
  Clock,
  CalendarDays,
  Trophy,
  Loader2,
} from "lucide-react";

export function TypeBadge({ type }: { type: string }) {
  const isInstall = type === "installation";
  return (
    <Badge size="xs" variant="neutral">
      <span className="inline-flex items-center gap-1.5">
        {isInstall ? (
          <Wrench className="h-3.5 w-3.5" />
        ) : (
          <Truck className="h-3.5 w-3.5" />
        )}
        {isInstall ? "Montaż" : "Dostawa"}
      </span>
    </Badge>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
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

export function OutcomeBadge({
  outcome,
  iconOnly = true,
}: {
  outcome: "won" | "lost" | null | undefined;
  iconOnly?: boolean;
}) {
  const isWon = outcome === "won";
  const isLost = outcome === "lost";

  if (iconOnly) {
    // Ikona + kolor, bez tekstu, z a11y i tooltipem (również dla braku wyniku)
    const label = isWon ? "Wygrane" : isLost ? "Przegrane" : "W trakcie";
    const colorClass = isWon
      ? "text-emerald-600 dark:text-emerald-400"
      : isLost
        ? "text-rose-600 dark:text-rose-400"
        : "text-black/45 dark:text-white/45";
    return (
      <span className={colorClass} aria-label={label} title={label}>
        {isWon ? (
          <Trophy className="h-4 w-4" aria-hidden />
        ) : isLost ? (
          <XCircle className="h-4 w-4" aria-hidden />
        ) : (
          <Loader2 className="h-4 w-4" aria-hidden />
        )}
      </span>
    );
  }

  // Wariant z etykietą (rzadziej używany), z neutralnym stanem dla braku wyniku
  if (isWon || isLost) {
    return (
      <Badge size="xs" variant={isWon ? "success" : "destructive"}>
        <span className="inline-flex items-center gap-1.5">
          {isWon ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {isWon ? "Wygrane" : "Przegrane"}
        </span>
      </Badge>
    );
  }
  return (
    <Badge size="xs" variant="neutral">
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5" />W trakcie
      </span>
    </Badge>
  );
}

export function PipelineStageBadge({
  stage,
}: {
  stage: string | null | undefined;
}) {
  const [labels, setLabels] = useState<Record<string, string>>(
    defaultPipelineStageLabels,
  );
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ustawienia/projekt", { cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as {
            pipelineStageLabels?: Record<string, string>;
          };
          if (j?.pipelineStageLabels) setLabels(j.pipelineStageLabels);
        }
      } catch {
        // ignore fetch errors
      }
    })();
  }, []);
  if (!stage) {
    return (
      <Badge size="xs" variant="neutral">
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5" />
          Etap
        </span>
      </Badge>
    );
  }
  // Prosty dobór ikon wg prefiksu
  let icon: React.ReactNode = <Clock className="h-3.5 w-3.5" />;
  if (stage === "delivery") icon = <Truck className="h-3.5 w-3.5" />;
  if (stage === "done") icon = <CheckCircle2 className="h-3.5 w-3.5" />;
  if (stage === "before_installation" || stage === "awaiting_measurement")
    icon = <Wrench className="h-3.5 w-3.5" />;
  return (
    <Badge size="xs" variant="neutral">
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {labels[stage] || stage}
      </span>
    </Badge>
  );
}
