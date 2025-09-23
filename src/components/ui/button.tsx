import * as React from "react";
import { twMerge } from "tailwind-merge";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-60 disabled:pointer-events-none";
    const variants = {
      default: "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90",
      outline: "border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10",
      ghost: "hover:bg-black/5 dark:hover:bg-white/10",
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
