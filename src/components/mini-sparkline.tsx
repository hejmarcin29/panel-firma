"use client";
import React from "react";

export function MiniSparkline({
  points,
  width = 160,
  height = 48,
  stroke = "currentColor",
  fill = "none",
  showDots = true,
  responsive = false,
}: {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showDots?: boolean;
  /** When true, the sparkline expands to the container width on the client. */
  responsive?: boolean;
}) {
  // Hooks must be called unconditionally at the top level
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState<number>(width);
  React.useEffect(() => {
    if (!responsive) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cw = Math.floor(e.contentRect.width);
        if (cw > 0) setW(cw);
      }
    });
    ro.observe(el);
    // initial measure
    const cw = el.clientWidth;
    if (cw > 0) setW(cw);
    return () => ro.disconnect();
  }, [responsive]);

  if (!points || points.length === 0) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => (max - min === 0 ? 0.5 : (v - min) / (max - min));
  const stepX = (w || width) / Math.max(1, points.length - 1);
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${i * stepX} ${height - norm(p) * height}`,
    )
    .join(" ");
  const lastX = (points.length - 1) * stepX;
  const lastY = height - norm(points[points.length - 1]) * height;
  return (
    <div ref={containerRef} className={responsive ? "w-full" : undefined}>
      <svg
        width={responsive ? w : width}
        height={height}
        viewBox={`0 0 ${responsive ? w : width} ${height}`}
        className="overflow-visible"
        style={responsive ? { width: "100%", height } : undefined}
      >
        <path
          d={d}
          stroke={stroke}
          strokeWidth={2}
          fill={fill}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {showDots && <circle cx={lastX} cy={lastY} r={3} fill={stroke} />}
      </svg>
    </div>
  );
}
