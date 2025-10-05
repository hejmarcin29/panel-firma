"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  Package,
  Settings2,
  Truck,
  Users as UsersIcon,
  Handshake,
  LineChart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    title: "Panel",
    badge: null as string | null,
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Zlecenia", href: "/zlecenia", icon: ClipboardList },
      { title: "Dostawy", href: "/dostawy", icon: Truck },
      { title: "Montaże", href: "/montaze", icon: HardHat },
      { title: "Pomiary", href: "/pomiary", icon: LineChart },
    ],
  },
  {
    title: "CRM",
    badge: null as string | null,
    items: [
      { title: "Klienci", href: "/klienci", icon: UsersIcon },
      { title: "Partnerzy", href: "/partnerzy", icon: Handshake },
    ],
  },
  {
    title: "Katalog",
    badge: null as string | null,
    items: [
      { title: "Produkty", href: "/produkty", icon: Package },
      { title: "Pliki", href: "/pliki", icon: FileText },
    ],
  },
  {
    title: "Administracja",
    badge: null as string | null,
    items: [
      { title: "Użytkownicy", href: "/uzytkownicy", icon: UsersIcon },
      { title: "Logi", href: "/logi", icon: ActivitySquare },
      { title: "Ustawienia", href: "/ustawienia", icon: Settings2 },
    ],
  },
];

export function AppSidebar({
  notifications = 0,
}: {
  notifications?: number;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-white/10 bg-gradient-to-tr from-primary/90 via-primary to-primary-foreground/20 p-4 text-primary-foreground">
        <Link href="/" className="flex items-center gap-3">
          <Badge variant="secondary" className="rounded-full bg-white/20 text-white backdrop-blur">
            appgit
          </Badge>
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wide text-white">Panel</span>
            <span className="text-xs text-white/80">Kontrola operacji</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href} className="flex items-center gap-2">
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.href === "/zlecenia" && notifications > 0 ? (
                        <SidebarMenuBadge className="bg-primary/20 text-primary">
                          {notifications}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
