"use client";
import React from "react";

export function MiniSparkline({
  points,
  width = 160,
  height = 48,
  stroke = "currentColor",
  fill = "none",
  showDots = true,
}: {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showDots?: boolean;
}) {
  if (!points || points.length === 0) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => (max - min === 0 ? 0.5 : (v - min) / (max - min));
  const stepX = width / (points.length - 1);
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${i * stepX} ${height - norm(p) * height}`,
    )
    .join(" ");
  const lastX = (points.length - 1) * stepX;
  const lastY = height - norm(points[points.length - 1]) * height;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
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
  );
}
