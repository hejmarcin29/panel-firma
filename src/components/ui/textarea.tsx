import * as React from "react";
import { twMerge } from "tailwind-merge";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={twMerge(
      "w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
