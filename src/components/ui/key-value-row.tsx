import React from "react";
import clsx from "clsx";

export type KeyValueRowProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

/**
 * Standardowy wiersz etykieta → wartość.
 * - Etykieta: stała szerokość, nie zawija się (basis-24)
 * - Wartość: elastyczna, może się ściskać i zawijać (min-w-0 max-w-full)
 * - Teksty wewnątrz wartości powinny mieć break-words/break-all jeśli mogą być długie.
 */
export function KeyValueRow({
  label,
  children,
  className,
  labelClassName,
  valueClassName,
}: KeyValueRowProps) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div className={clsx("opacity-60 shrink-0 basis-24", labelClassName)}>
        {label}
      </div>
      <div
        className={clsx(
          "min-w-0 max-w-full flex items-center gap-2",
          valueClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function BreakableText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={clsx("break-words break-all", className)}>{children}</span>;
}
