"use client";
import * as React from "react";

type StatusKey = string;

export type PipelineOrder = {
  id: string;
  title: string;
  clientName?: string | null;
  status: StatusKey;
  createdAt?: number | null;
};

export type OrdersPipelineProps = {
  orders: PipelineOrder[];
  statuses: { key: StatusKey; label: string }[];
};

export function OrdersPipeline({ orders, statuses }: OrdersPipelineProps) {
  // Group orders by status (ensure all statuses exist)
  const byStatus = React.useMemo(() => {
    const m = new Map<StatusKey, PipelineOrder[]>();
    for (const s of statuses) m.set(s.key, []);
    for (const o of orders) {
      const k = o.status;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(o);
    }
    return m;
  }, [orders, statuses]);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const updateShadows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 2);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateShadows();
    const onScroll = () => updateShadows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateShadows());
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateShadows]);

  // Drag-to-scroll (native wheel/touch will work; buttons also provided)
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const state = { down: false, x: 0, left: 0 };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      state.down = true;
      state.x = e.clientX;
      state.left = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      (el as HTMLElement).classList.add("is-grabbing");
    };
    const move = (e: PointerEvent) => {
      if (!state.down) return;
      const dx = e.clientX - state.x;
      el.scrollLeft = state.left - dx;
    };
    const up = (e: PointerEvent) => {
      if (!state.down) return;
      state.down = false;
      (el as HTMLElement).classList.remove("is-grabbing");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", up);
    };
  }, []);

  const scrollByAmount = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(320, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Gradient edges as overflow hint */}
      {canLeft && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[var(--background)] to-transparent"
        />
      )}
      {canRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--background)] to-transparent"
        />
      )}

      {/* Scroll controls */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-1 pr-2">
        <button
          type="button"
          aria-label="Przewiń w lewo"
          onClick={() => scrollByAmount(-1)}
          disabled={!canLeft}
          className="h-8 w-8 rounded-full border text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--pp-border)", background: "var(--pp-panel)" }}
        >
          ‹
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pl-2 pr-1">
        <button
          type="button"
          aria-label="Przewiń w prawo"
          onClick={() => scrollByAmount(1)}
          disabled={!canRight}
          className="h-8 w-8 rounded-full border text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--pp-border)", background: "var(--pp-panel)" }}
        >
          ›
        </button>
      </div>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Pipeline zleceń"
        tabIndex={0}
        className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-2 cursor-grab"
        style={{
          overscrollBehaviorX: "contain",
          contain: "layout paint",
          touchAction: "pan-x",
          WebkitOverflowScrolling: "touch",
          scrollbarGutter: "stable",
        }}
      >
        <div className="inline-flex whitespace-nowrap gap-3 pr-8 align-stretch">
          {statuses.map((s) => {
            const col = byStatus.get(s.key) ?? [];
            return (
              <div
                key={s.key}
                className="w-[300px] shrink-0 rounded-md border bg-[var(--pp-panel)]"
                style={{ borderColor: "var(--pp-border)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium"
                  style={{ borderBottom: "1px solid var(--pp-border)" }}
                >
                  <span className="truncate" title={s.label}>{s.label}</span>
                  <span className="ml-2 text-xs opacity-70">{col.length}</span>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {col.length === 0 ? (
                    <div className="text-xs opacity-60 px-2 py-3">Brak pozycji</div>
                  ) : (
                    <ul className="space-y-2">
                      {col.map((o) => (
                        <li
                          key={o.id}
                          className="rounded-md border p-2 bg-[var(--pp-canvas-overlay)]"
                          style={{ borderColor: "var(--pp-border)" }}
                        >
                          <div
                            className="text-sm font-medium truncate"
                            title={o.title}
                            style={{ wordBreak: "break-word" }}
                          >
                            {o.title}
                          </div>
                          {o.clientName ? (
                            <div
                              className="text-xs opacity-70 truncate"
                              title={o.clientName ?? undefined}
                              style={{ wordBreak: "break-word" }}
                            >
                              {o.clientName}
                            </div>
                          ) : null}
                          {o.createdAt ? (
                            <div className="text-[11px] opacity-60 mt-1">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
