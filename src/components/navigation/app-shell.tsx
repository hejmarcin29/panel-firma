"use client";

import { ReactNode } from "react";
import { Bell, HelpCircle, Search, Settings2 } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AppShellUser = {
  displayName: string;
  role?: string | null;
  initials: string;
};

export function AppShell({
  children,
  user,
  notifications = 0,
}: {
  children: ReactNode;
  user: AppShellUser;
  notifications?: number;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <AppSidebar notifications={notifications} />
  <SidebarInset className="relative flex flex-1 flex-col gap-6 overflow-x-hidden bg-background/80 pb-10">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border/60 bg-background/70 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-1 items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden flex-1 items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 shadow-sm md:flex">
                <Search className="size-4 text-muted-foreground" aria-hidden />
                <Input
                  placeholder="Szukaj klienta, zlecenia lub partnera"
                  className="h-auto w-full border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  aria-label="Wyszukiwarka panelu"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Centrum pomocy">
                <HelpCircle className="size-5" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" className="relative" aria-label="Powiadomienia">
                <Bell className="size-5" aria-hidden />
                {notifications > 0 ? (
                  <span className="absolute right-1 top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                    {notifications}
                  </span>
                ) : null}
              </Button>
              <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="Ustawienia">
                <Settings2 className="size-5" aria-hidden />
              </Button>
              <div className="flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                <Avatar className="size-9 border border-border/40">
                  <AvatarFallback className="text-sm font-semibold uppercase text-muted-foreground">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col sm:flex">
                  <span className="text-sm font-semibold text-foreground">{user.displayName}</span>
                  {user.role ? (
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {user.role}
                    </span>
                  ) : null}
                </div>
              </div>
              <LogoutButton />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-6 px-6">
            <div className="flex flex-1 flex-col gap-6 pb-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
