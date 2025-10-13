"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  ClipboardList,
  FileText,
  HardHat,
  Home,
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

type NavigationItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  roles?: string[];
};

type NavigationSection = {
  title: string;
  badge: string | null;
  items: NavigationItem[];
  roles?: string[];
};

const navigation: NavigationSection[] = [
  {
    title: "Panel",
    badge: null,
    items: [
      { title: "Strona główna", href: "/", icon: Home, roles: ["ADMIN", "MONTER", "PARTNER"] },
      { title: "Zlecenia", href: "/zlecenia", icon: ClipboardList, roles: ["ADMIN", "MONTER"] },
      { title: "Dostawy", href: "/dostawy", icon: Truck, roles: ["ADMIN"] },
      { title: "Montaże", href: "/montaze", icon: HardHat, roles: ["ADMIN", "MONTER"] },
      { title: "Dostawy pod montaż", href: "/dostawy-pod-montaz", icon: Package, roles: ["ADMIN", "MONTER"] },
      { title: "Pomiary", href: "/pomiary", icon: LineChart, roles: ["ADMIN", "MONTER"] },
    ],
  },
  {
    title: "CRM",
    badge: null,
    items: [
      { title: "Klienci", href: "/klienci", icon: UsersIcon, roles: ["ADMIN"] },
      { title: "Partnerzy", href: "/partnerzy", icon: Handshake, roles: ["ADMIN"] },
    ],
    roles: ["ADMIN"],
  },
  {
    title: "Katalog",
    badge: null,
    items: [
      { title: "Produkty", href: "/produkty", icon: Package, roles: ["ADMIN"] },
      { title: "Pliki", href: "/pliki", icon: FileText, roles: ["ADMIN"] },
    ],
    roles: ["ADMIN"],
  },
  {
    title: "Administracja",
    badge: null,
    items: [
      { title: "Użytkownicy", href: "/uzytkownicy", icon: UsersIcon, roles: ["ADMIN"] },
      { title: "Logi", href: "/logi", icon: ActivitySquare, roles: ["ADMIN"] },
      { title: "Ustawienia", href: "/ustawienia", icon: Settings2, roles: ["ADMIN"] },
    ],
    roles: ["ADMIN"],
  },
];

export function AppSidebar({
  notifications = 0,
  userRole = null,
}: {
  notifications?: number;
  userRole?: string | null;
}) {
  const pathname = usePathname();

  // Filtrowanie sekcji i elementów według roli użytkownika
  const filteredNavigation = navigation
    .filter((section) => {
      // Jeśli sekcja ma określone role, sprawdź czy użytkownik ma dostęp
      if (section.roles && userRole) {
        return section.roles.includes(userRole);
      }
      // Jeśli sekcja nie ma ograniczeń, pokaż ją
      return true;
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Filtruj elementy według roli
        if (item.roles && userRole) {
          return item.roles.includes(userRole);
        }
        // Jeśli element nie ma ograniczeń, pokaż go
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0); // Usuń puste sekcje

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
        {filteredNavigation.map((section) => (
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
