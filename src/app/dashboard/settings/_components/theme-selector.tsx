"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themes = [
    {
      id: "light",
      label: "Porcelain Day",
      description: "Czysty i Przejrzysty",
      icon: Sun,
      color: "bg-white",
      textColor: "text-zinc-900",
      borderColor: "border-zinc-200",
      activeBorder: "ring-2 ring-zinc-900",
      content: (
        <div className="flex flex-col gap-2 p-3 opacity-60">
          <div className="h-2 w-1/2 rounded-full bg-zinc-200" />
          <div className="h-2 w-3/4 rounded-full bg-zinc-200" />
          <div className="mt-2 flex gap-2">
            <div className="h-8 w-8 rounded-md bg-zinc-100" />
            <div className="h-8 w-8 rounded-md bg-zinc-100" />
          </div>
        </div>
      ),
    },
    {
      id: "dark",
      label: "Midnight Glass",
      description: "Głęboki i Skupiony",
      icon: Moon,
      color: "bg-zinc-950",
      textColor: "text-white",
      borderColor: "border-zinc-800",
      activeBorder: "ring-2 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]",
      content: (
        <div className="flex flex-col gap-2 p-3 opacity-60">
          <div className="h-2 w-1/2 rounded-full bg-zinc-800" />
          <div className="h-2 w-3/4 rounded-full bg-zinc-800" />
          <div className="mt-2 flex gap-2">
            <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800" />
            <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800" />
          </div>
        </div>
      ),
    },
    {
      id: "system",
      label: "Dynamic System",
      description: "Smart & Auto",
      icon: Laptop,
      color: "bg-gradient-to-br from-zinc-900 to-white",
      textColor: "text-zinc-900 dark:text-white",
      borderColor: "border-zinc-200 dark:border-zinc-800",
      activeBorder: "ring-2 ring-primary",
      content: null, // Handled specially in render
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <motion.button
            key={t.id}
            onClick={() => setTheme(t.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative flex h-40 flex-col overflow-hidden rounded-xl border text-left transition-all",
              t.color,
              t.borderColor,
              isActive ? t.activeBorder : "hover:border-primary/50"
            )}
          >
            {/* Content Preview */}
            <div className="relative flex-1 w-full overflow-hidden">
                {t.id === 'system' ? (
                    <div className="relative h-full w-full">
                        <div className="absolute inset-0 bg-zinc-950" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}>
                             <div className="p-3 opacity-40">
                                <div className="h-2 w-12 rounded-full bg-zinc-700 mb-2" />
                                <div className="h-2 w-20 rounded-full bg-zinc-700" />
                             </div>
                        </div>
                        <div className="absolute inset-0 bg-white" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
                             <div className="absolute bottom-0 right-0 p-3 opacity-40 flex flex-col items-end">
                                <div className="h-2 w-12 rounded-full bg-zinc-300 mb-2" />
                                <div className="h-2 w-20 rounded-full bg-zinc-300" />
                             </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <div className="rounded-full bg-background/80 p-2 backdrop-blur-sm shadow-sm border">
                                <t.icon className="h-5 w-5 text-foreground" />
                             </div>
                        </div>
                    </div>
                ) : (
                    t.content
                )}
            </div>

            {/* Label & Description */}
            <div className={cn("relative z-10 p-4 w-full", t.id === 'dark' ? 'text-white' : t.id === 'light' ? 'text-zinc-900' : 'text-foreground bg-background/50 backdrop-blur-sm')}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTheme"
                    className="h-2 w-2 rounded-full bg-primary"
                  />
                )}
              </div>
              <p className={cn("text-xs opacity-70", t.id === 'dark' ? 'text-zinc-400' : t.id === 'light' ? 'text-zinc-500' : 'text-muted-foreground')}>
                {t.description}
              </p>
            </div>
            
            {/* Ripple Effect Overlay */}
            {isActive && (
                <motion.div
                    layoutId="ripple"
                    className="absolute inset-0 z-0 bg-primary/5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
