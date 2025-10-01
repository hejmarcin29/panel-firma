"use client";
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={[
        "z-50 rounded-md border border-black/15 bg-[var(--pp-panel)] p-2 text-popover-foreground shadow-md outline-none",
        // animacje jak w dropdown: delikatny fade+zoom+slide zgodnie z kierunkiem
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        className || "",
      ].join(" ")}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export const PopoverAnchor = PopoverPrimitive.Anchor;