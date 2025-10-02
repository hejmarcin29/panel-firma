"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileSidebarOverlay } from "@/components/mobile-sidebar-overlay";

const PUBLIC_PREFIXES = ["/login", "/setup", "/public"] as const;

export function LayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hideChrome = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (hideChrome) {
    return (
      <main id="main-content" className="px-0 md:px-6 py-4 md:py-6 overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen md:pl-64">
        <Topbar />
        <main id="main-content" className="px-0 md:px-6 py-4 md:py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileSidebarOverlay />
    </div>
  );
}
