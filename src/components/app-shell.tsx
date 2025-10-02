"use client";
import { usePathname } from "next/navigation";
import React from "react";

const PUBLIC_ROUTES = new Set<string>(["/login", "/setup", "/public"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hideChrome = Array.from(PUBLIC_ROUTES).some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  return hideChrome ? (
    <main id="main-content" className="px-0 md:px-6 py-6">
      {children}
    </main>
  ) : (
    <>{children}</>
  );
}
