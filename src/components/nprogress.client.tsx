"use client";
import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

// Basic styles for NProgress (inline minimal). Users can override via globals.css if desired.
const ensureStyles = () => {
  if (document.getElementById("nprogress-inline-style")) return;
  const style = document.createElement("style");
  style.id = "nprogress-inline-style";
  style.textContent = `
    #nprogress { pointer-events: none; }
    #nprogress .bar { background: var(--pp-primary); position: fixed; z-index: 1031; top: 0; left: 0; width: 100%; height: 2px; }
    #nprogress .peg { display: block; position: absolute; right: 0px; width: 100px; height: 100%; box-shadow: 0 0 10px var(--pp-primary), 0 0 5px var(--pp-primary); opacity: 1; transform: rotate(3deg) translate(0px, -4px); }
    #nprogress .spinner { display: none; }
  `;
  document.head.appendChild(style);
};

export function NProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    ensureStyles();
    NProgress.configure({ showSpinner: false, trickleSpeed: 200 });
  }, []);

  // Start/stop on route changes (pathname + search params)
  useEffect(() => {
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 250); // short debounce to avoid flicker
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Optional: expose window helpers to mark long actions
  useEffect(() => {
    (
      window as unknown as {
        __ppNProgress?: { start: () => void; done: () => void };
      }
    ).__ppNProgress = {
      start: () => NProgress.start(),
      done: () => NProgress.done(),
    };
  }, []);

  return null;
}

export default NProgressProvider;
