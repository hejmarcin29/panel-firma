"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MontageView = "lead" | "in-progress" | "done";

type InProgressStage =
  | "all"
  | "before-measure"
  | "before-first-payment"
  | "before-install"
  | "before-invoice";

function useMontageFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentView = (searchParams.get("view") as MontageView) || "in-progress";
  const currentStage =
    (searchParams.get("stage") as InProgressStage) || "all";

  const updateParams = (patch: Partial<{ view: MontageView; stage: InProgressStage }>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (patch.view) {
      params.set("view", patch.view);
      if (patch.view !== "in-progress") {
        params.delete("stage");
      }
    }

    if (patch.stage) {
      params.set("stage", patch.stage);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return {
    currentView,
    currentStage,
    setView: (view: MontageView) => updateParams({ view, stage: view === "in-progress" ? currentStage : "all" }),
    setStage: (stage: InProgressStage) => updateParams({ view: "in-progress", stage }),
  };
}

export function MontageViewTabs() {
  const { currentView, setView } = useMontageFilters();

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-1 py-1 text-xs">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-7 rounded-full px-3",
          currentView === "lead" && "bg-background shadow-sm"
        )}
        onClick={() => setView("lead")}
      >
        Leady
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-7 rounded-full px-3",
          currentView === "in-progress" && "bg-background shadow-sm"
        )}
        onClick={() => setView("in-progress")}
      >
        W trakcie
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-7 rounded-full px-3",
          currentView === "done" && "bg-background shadow-sm"
        )}
        onClick={() => setView("done")}
      >
        Zakończono
      </Button>
    </div>
  );
}

export function MontageStageFilters() {
  const { currentView, currentStage, setStage } = useMontageFilters();

  if (currentView !== "in-progress") return null;

  return (
    <div className="w-full overflow-x-auto border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2 p-2 px-4 sm:px-6 min-w-max">
        <StageChip
          label="Wszystkie w trakcie"
          active={currentStage === "all"}
          onClick={() => setStage("all")}
        />
        <StageChip
          label="Przed pomiarem"
          active={currentStage === "before-measure"}
          onClick={() => setStage("before-measure")}
        />
        <StageChip
          label="Przed 1. wpłatą"
          active={currentStage === "before-first-payment"}
          onClick={() => setStage("before-first-payment")}
        />
        <StageChip
          label="Przed montażem"
          active={currentStage === "before-install"}
          onClick={() => setStage("before-install")}
        />
        <StageChip
          label="Przed FV i protokołem"
          active={currentStage === "before-invoice"}
          onClick={() => setStage("before-invoice")}
        />
      </div>
    </div>
  );
}

interface StageChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function StageChip({ label, active, onClick }: StageChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 border text-[11px] font-medium transition-colors whitespace-nowrap",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent bg-muted/60 hover:bg-muted text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
