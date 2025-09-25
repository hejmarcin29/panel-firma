import * as React from "react";
import { twMerge } from "tailwind-merge";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-[12px] font-medium transition-colors disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2";
    const variants = {
      default: "bg-[var(--pp-primary)] text-white hover:bg-[var(--pp-primary-600)] focus:ring-[var(--pp-primary-ring)]",
      outline: "border border-[var(--pp-primary)] text-[var(--pp-primary)] hover:bg-[var(--pp-primary-subtle-bg)] focus:ring-[var(--pp-primary-ring)]",
      ghost: "hover:bg-black/5 dark:hover:bg-white/10 focus:ring-[var(--pp-primary-ring)]",
    } as const;
    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-9 px-4 text-sm",
      lg: "h-10 px-5 text-base",
    } as const;
    return (
      <button ref={ref} className={twMerge(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";
