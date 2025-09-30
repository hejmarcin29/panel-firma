import React from "react";

type SpinnerProps = {
  size?: number;
  className?: string;
};

export function Spinner({ size = 16, className }: SpinnerProps) {
  const s = `${size}px`;
  return (
    <span
      aria-label="Ładowanie"
      role="status"
      className={`inline-block animate-spin rounded-full border-2 border-black/20 border-t-black/80 dark:border-white/20 dark:border-t-white/80 ${className ?? ""}`}
      style={{ width: s, height: s }}
    />
  );
}

export default Spinner;
