"use client";

import { LayoutDashboard, Menu, Package, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/panel", label: "Panel główny", icon: LayoutDashboard },
  { href: "/dropshipping", label: "Dropshipping", icon: Truck },
  { href: "/produkty", label: "Produkty", icon: Package },
] as const;

interface AppShellProps {
  children: ReactNode;
  userName?: string;
}

export function AppShell({ children, userName }: AppShellProps) {
  const currentPath = usePathname() ?? "/";

  const items = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        active: currentPath === item.href || currentPath.startsWith(`${item.href}/`),
      })),
    [currentPath],
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-[260px] shrink-0 border-r bg-background/95 px-5 py-8 lg:block">
        <Link href="/panel" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span>Panel operacyjny</span>
        </Link>
        <Separator className="my-6" />
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition", 
                active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm supports-[backdrop-filter]:backdrop-blur md:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-2xl">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Otwórz nawigację</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] border-r px-5 py-8">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                  </span>
                  <span>Panel operacyjny</span>
                </div>
                <Separator className="my-6" />
                <nav className="flex flex-col gap-1">
                  {items.map(({ href, label, icon: Icon, active }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                        active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-base font-semibold">Panel operacyjny</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden md:flex md:flex-col">
              <span className="text-sm font-semibold">{userName ?? "Hej, zespół!"}</span>
              <span className="text-xs text-muted-foreground">Tryb pilotażu</span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
