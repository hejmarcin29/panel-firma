"use client";
import { useSession, signOut } from "next-auth/react";
import { Search, Bell, Sun, Moon, Settings, Menu, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Tooltip } from "@/components/ui/tooltip";

export function Topbar() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const { theme, setTheme } = useTheme();
  const isDark = useMemo(() => theme === "dark", [theme]);

  return (
    <header
      className="sticky top-0 z-20 border-b bg-[var(--pp-panel)]/80 backdrop-blur"
      style={{ borderColor: "var(--pp-border)" }}
    >
      <div className="h-16 px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border"
            style={{ borderColor: "var(--pp-border)" }}
            aria-label="Menu"
            onClick={() => {
              const el = document.querySelector("aside");
              if (el) {
                const open = el.getAttribute("data-open") === "true";
                el.setAttribute("data-open", (!open).toString());
                const overlay = document.getElementById("sidebar-overlay");
                if (overlay) {
                  if (!open) {
                    overlay.classList.remove("opacity-0");
                    overlay.classList.remove("pointer-events-none");
                    document.body.classList.add("no-scroll");
                  } else {
                    overlay.classList.add("opacity-0");
                    overlay.classList.add("pointer-events-none");
                    document.body.classList.remove("no-scroll");
                  }
                }
              }
            }}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="relative flex-1 min-w-0 sm:max-w-md md:max-w-lg">
            <input
              type="search"
              placeholder="Szukaj"
              className="w-full h-9 rounded-md border pl-9 pr-3 text-sm bg-[var(--pp-panel)]"
              style={{ borderColor: "var(--pp-border)" }}
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          </div>
        </div>
  <div className="flex items-center gap-2">
          <Tooltip content="Powiadomienia">
            <button
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border"
              style={{ borderColor: "var(--pp-border)" }}
              aria-label="Powiadomienia"
            >
              <Bell className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip content="Ustawienia">
            <button
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border"
              style={{ borderColor: "var(--pp-border)" }}
              aria-label="Ustawienia"
            >
              <Settings className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip
            content={
              isDark
                ? "Motyw: ciemny (kliknij aby jasny)"
                : "Motyw: jasny (kliknij aby ciemny)"
            }
          >
            <button
              onClick={() => {
                // Enable smooth theme transition for a brief moment
                const html = document.documentElement;
                html.classList.add("theme-transition");
                setTimeout(
                  () => html.classList.remove("theme-transition"),
                  250,
                );
                setTheme(isDark ? "light" : "dark");
              }}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md border"
              style={{ borderColor: "var(--pp-border)" }}
              aria-label="Przełącz motyw"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </Tooltip>
          {isAuthed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-1 inline-flex items-center rounded-md border px-2 md:px-3 h-9 text-sm font-medium"
              style={{ borderColor: "var(--pp-border)" }}
              aria-label="Wyloguj"
              title="Wyloguj"
            >
              <LogOut className="h-4 w-4 md:hidden" aria-hidden />
              <span className="hidden md:inline">Wyloguj</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
