import * as React from "react";
import { twMerge } from "tailwind-merge";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={twMerge("w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 border-[var(--pp-border)] focus:ring-[var(--pp-primary-ring)]", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";
