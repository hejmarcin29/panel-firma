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

export function MontageViewSwitcher() {
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

  const setView = (view: MontageView) => {
    updateParams({ view, stage: view === "in-progress" ? currentStage : "all" });
  };

  const setStage = (stage: InProgressStage) => {
    updateParams({ view: "in-progress", stage });
  };

  return (
    <div className="flex flex-col gap-2">
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

      {currentView === "in-progress" && (
        <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
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
      )}
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
        "rounded-full px-2.5 py-1 border text-[11px] leading-none",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-transparent bg-muted/60 hover:bg-muted text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
