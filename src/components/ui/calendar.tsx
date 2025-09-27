"use client";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  className?: string;
};

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={[
        "rounded-md border border-black/15 bg-white p-2 text-sm dark:border-white/15 dark:bg-neutral-900",
        className || "",
      ].join(" ")}
      classNames={{
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_selected:
          "bg-[var(--pp-primary)] text-white hover:bg-[var(--pp-primary-600)] focus:bg-[var(--pp-primary-600)]",
        day_today: "bg-black/5 dark:bg-white/10",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
      showOutsideDays
      fixedWeeks
      {...props}
    />
  );
}
