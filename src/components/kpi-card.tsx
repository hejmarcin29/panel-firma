"use client";
import React from "react";

export function KpiCard({
  title,
  value,
  delta,
  icon,
}: {
  title: string;
  value: string | number;
  delta?: { value: number; label?: string } | null;
  icon?: React.ReactNode;
}) {
  const positive = (delta?.value ?? 0) >= 0;
  const deltaText = delta
    ? `${positive ? "+" : ""}${delta.value}${delta.label ?? "%"}`
    : null;
  return (
    <div
      className="rounded-xl border bg-[var(--pp-panel)] p-4 shadow-sm"
      style={{ borderColor: "var(--pp-border)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-70">{title}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {value}
          </div>
        </div>
        {icon ? (
          <div
            className="grid h-10 w-10 place-items-center rounded-lg"
            style={{
              background: "var(--pp-primary-subtle-bg)",
              color: "var(--pp-primary)",
            }}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {deltaText && (
        <div className="mt-2 text-xs">
          <span
            className={
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {deltaText}
          </span>
          <span className="opacity-60"> vs poprzedni okres</span>
        </div>
      )}
    </div>
  );
}
