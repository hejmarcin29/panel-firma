"use client";
import * as React from "react";
import * as RD from "@radix-ui/react-dropdown-menu";

type DropdownMenuProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  triggerClassName?: string;
};

export function DropdownMenu({
  trigger,
  children,
  align = "start",
  triggerClassName,
}: DropdownMenuProps) {
  return (
    <RD.Root>
      <RD.Trigger asChild>
        <button
          type="button"
          className={[
            "inline-flex h-9 items-center rounded-md border bg-transparent px-3 text-sm",
            "hover:bg-black/5 dark:hover:bg-white/10",
            "border-black/15 dark:border-white/15",
            triggerClassName || "",
          ].join(" ")}
          style={{ borderColor: "var(--pp-border)" }}
        >
          {trigger}
        </button>
      </RD.Trigger>
      <RD.Portal>
        <RD.Content
          sideOffset={6}
          align={align === "end" ? "end" : "start"}
          className="z-50 min-w-36 rounded border border-black/15 bg-white p-1 text-sm shadow-lg outline-none dark:border-white/15 dark:bg-neutral-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {children}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

export function DropdownItem({
  onSelect,
  children,
}: {
  onSelect?: () => void;
  children: React.ReactNode;
}) {
  return (
    <RD.Item
      onSelect={(e) => {
        e.preventDefault();
        onSelect?.();
      }}
      className="relative flex w-full cursor-pointer select-none items-center rounded px-2 py-1 text-left outline-none hover:bg-black/5 focus:bg-black/5 dark:hover:bg-white/10 dark:focus:bg-white/10"
    >
      {children}
    </RD.Item>
  );
}
