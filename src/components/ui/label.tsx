import * as React from "react";
import { twMerge } from "tailwind-merge";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={twMerge("text-sm font-medium", className)} {...props} />
  );
}
