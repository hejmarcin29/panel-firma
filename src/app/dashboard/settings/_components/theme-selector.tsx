"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit border border-border/50">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className={cn("gap-2 transition-all", theme === "light" && "shadow-sm")}
      >
        <Sun className="h-4 w-4" />
        <span className="hidden sm:inline">Jasny</span>
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn("gap-2 transition-all", theme === "dark" && "shadow-sm")}
      >
        <Moon className="h-4 w-4" />
        <span className="hidden sm:inline">Ciemny</span>
      </Button>
      <Button
        variant={theme === "system" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        className={cn("gap-2 transition-all", theme === "system" && "shadow-sm")}
      >
        <Laptop className="h-4 w-4" />
        <span className="hidden sm:inline">System</span>
      </Button>
    </div>
  );
}
