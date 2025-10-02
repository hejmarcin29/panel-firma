"use client";
import * as React from "react";

export type ContainerMode = "wide" | "condensed" | "compact";

/**
 * useContainerMode
 * Observes the width of the given container and returns a mode string used
 * to adapt dense table/card layouts for split-screen and narrow panes.
 *
 * Breakpoints (tweak if needed):
 * - wide:      >= 1080px
 * - condensed: 720px – 1079px
 * - compact:   < 720px
 */
export function useContainerMode<T extends HTMLElement = HTMLDivElement>(): {
  ref: React.MutableRefObject<T | null>;
  mode: ContainerMode;
  width: number;
} {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Initial measure on mount
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      setWidth((prev) => (prev !== w ? w : prev));
    };
    measure();

    // Observe element size changes
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.floor(entry.contentRect.width);
        setWidth((prev) => (prev !== w ? w : prev));
      });
      ro.observe(el);
    }

    // Fallback: respond to window resize/orientation changes (e.g., OS split-screen snap)
    let raf = 0;
    const onWinResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const mode: ContainerMode = width >= 1080 ? "wide" : width >= 720 ? "condensed" : "compact";

  return { ref, mode, width };
}
