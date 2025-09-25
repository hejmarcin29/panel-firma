import * as React from "react";
import { twMerge } from "tailwind-merge";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "neutral" | "success" | "warning" | "destructive";
  size?: "xs" | "sm";
};

export function Badge({ className, variant = "neutral", size = "xs", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 font-medium";
  const variants = {
    default: "bg-[var(--pp-primary)] text-white",
    neutral: "bg-[var(--pp-primary-subtle-bg)] text-[var(--pp-text)]",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-900",
    destructive: "bg-red-100 text-red-900",
  } as const;
  const sizes = {
    xs: "text-[11px]",
    sm: "text-xs",
  } as const;
  return <span className={twMerge(base, variants[variant], sizes[size], className)} {...props} />;
}
