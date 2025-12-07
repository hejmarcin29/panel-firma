"use client";

import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDensity } from "@/components/density-provider";

export function DensitySelector() {
  const { density, setDensity } = useDensity();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit border border-border/50">
      <Button
        variant={density === "comfortable" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDensity("comfortable")}
        className={cn("gap-2 transition-all", density === "comfortable" && "shadow-sm")}
      >
        <Maximize2 className="h-4 w-4" />
        <span className="hidden sm:inline">Wygodny</span>
      </Button>
      <Button
        variant={density === "compact" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDensity("compact")}
        className={cn("gap-2 transition-all", density === "compact" && "shadow-sm")}
      >
        <Minimize2 className="h-4 w-4" />
        <span className="hidden sm:inline">Kompaktowy</span>
      </Button>
    </div>
  );
}
