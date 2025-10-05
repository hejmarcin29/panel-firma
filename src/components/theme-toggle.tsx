"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <Button
      aria-label="Przełącz motyw"
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full border border-border/60 bg-background/60 shadow-sm backdrop-blur"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      disabled={!mounted}
    >
      <SunMedium className="size-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
      <MoonStar className="absolute size-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Przełącz motyw</span>
    </Button>
  );
}
