"use client";
import React from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

function isInteractive(el: HTMLElement | null, stopAt?: HTMLElement | null): boolean {
  let cur: HTMLElement | null = el;
  while (cur) {
    if (stopAt && cur === stopAt) break;
    const tag = cur.tagName;
    if (
      tag === "A" ||
      tag === "BUTTON" ||
      tag === "INPUT" ||
      tag === "SELECT" ||
      tag === "TEXTAREA"
    )
      return true;
    const role = cur.getAttribute("role");
    if (role === "button" || role === "link") return true;
    if ((cur as HTMLElement).dataset?.noRowNav) return true;
    cur = cur.parentElement;
  }
  return false;
}

export function ClickableCard({
  href,
  className,
  children,
  role = "link",
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  role?: "link" | "button";
}) {
  const router = useRouter();
  const go = React.useCallback(() => router.push(href), [href, router]);

  const onActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ("key" in e) {
      const ke = e as React.KeyboardEvent;
      if (ke.key !== "Enter" && ke.key !== " ") return;
      ke.preventDefault();
      go();
      return;
    }
    const me = e as React.MouseEvent;
    if (me.defaultPrevented) return;
    if (isInteractive(me.target as HTMLElement, me.currentTarget as HTMLElement)) return;
    go();
  };

  return (
    <div
      role={role}
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={onActivate}
      className={clsx(
        "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pp-primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
