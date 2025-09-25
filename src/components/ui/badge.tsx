import * as React from "react";
import { twMerge } from "tailwind-merge";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "neutral" | "success" | "warning" | "destructive";
  size?: "xs" | "sm";
};

export function Badge({ className, variant = "neutral", size = "xs", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded px-2 py-0.5 font-medium";
  const variants = {
    default: "bg-black text-white dark:bg-white dark:text-black",
    neutral: "bg-black/5 text-foreground dark:bg-white/10",
    success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    destructive: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100",
  } as const;
  const sizes = {
    xs: "text-[11px]",
    sm: "text-xs",
  } as const;
  return <span className={twMerge(base, variants[variant], sizes[size], className)} {...props} />;
}
