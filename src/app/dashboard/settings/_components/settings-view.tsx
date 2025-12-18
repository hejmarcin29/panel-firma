"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Activity,
  Globe,
  Smartphone,
  Palette,
  RefreshCw,
  Users,
  BookOpen,
  ArrowLeft,
  Trash2,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  children: React.ReactNode;
  appearance: React.ReactNode;
  logs: React.ReactNode;
  integrations: React.ReactNode;
  montageSettings: React.ReactNode;
  mobileMenuSettings: React.ReactNode;
  kpiSettings: React.ReactNode;
  wpChanges: React.ReactNode;
  teamSettings: React.ReactNode;
  documentation: React.ReactNode;
  trash: React.ReactNode;
  portalSettings: React.ReactNode;
  contractTemplatesManager: React.ReactNode;
}

export function SettingsView({
  children,
  appearance,
  logs,
  integrations,
  montageSettings,
  mobileMenuSettings,
  kpiSettings,
  wpChanges,
  teamSettings,
  documentation,
  trash,
  portalSettings,
  contractTemplatesManager,
}: SettingsViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const tabParam = searchParams.get('tab');
  const currentTab = tabParam || 'appearance';
  const isMobileMenuOpen = !tabParam;

  const handleTabChange = (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`${pathname}?${params.toString()}`);
  };

  const handleBack = () => {
    router.push(pathname);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        {!isMobileMenuOpen && (
            <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden -ml-2" 
                onClick={handleBack}
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
        )}
        <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ustawienia</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
            Zarządzaj konfiguracją aplikacji, integracjami i kontami pocztowymi.
            </p>
        </div>
      </div>

      {/* Mobile settings hub - visible only when no tab is selected on mobile */}
      <div className={cn("grid gap-2 md:hidden", !isMobileMenuOpen && "hidden")}>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("appearance")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Palette className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Wygląd</span>
            <span className="text-xs text-muted-foreground">Motyw panelu i tryb ciemny.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("general")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Settings className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Ogólne</span>
            <span className="text-xs text-muted-foreground">Podstawowe ustawienia systemu.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("portal")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <MessageSquare className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Portal & SMS</span>
            <span className="text-xs text-muted-foreground">Konfiguracja portalu klienta i powiadomień.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("contracts")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <FileText className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Umowy</span>
            <span className="text-xs text-muted-foreground">Szablony umów i dokumentów.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("integrations")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Globe className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Integracje</span>
            <span className="text-xs text-muted-foreground">WooCommerce, Google i inne.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("kpi")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Activity className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">KPI / Alerty</span>
            <span className="text-xs text-muted-foreground">Progi ostrzeżeń dla montaży i zamówień.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("mobile-menu")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Smartphone className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Menu mobilne</span>
            <span className="text-xs text-muted-foreground">Konfiguracja skrótów w aplikacji.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("montage")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Activity className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Montaże</span>
            <span className="text-xs text-muted-foreground">Etapy, automatyzacje i statusy montaży.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("wp-changes")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <RefreshCw className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Zmiany WP</span>
            <span className="text-xs text-muted-foreground">Śledzenie zmian wysyłanych do WordPressa.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("logs")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Activity className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Logi systemowe</span>
            <span className="text-xs text-muted-foreground">Ostatnie zdarzenia i błędy w systemie.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("documentation")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Dokumentacja</span>
            <span className="text-xs text-muted-foreground">Opis logiki biznesowej i procesów.</span>
          </span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 h-auto gap-3 bg-card border shadow-sm"
          onClick={() => handleTabChange("trash")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Trash2 className="h-4 w-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-medium">Kosz</span>
            <span className="text-xs text-muted-foreground">Przywracanie usuniętych elementów.</span>
          </span>
        </Button>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className={cn("flex flex-col md:flex-row gap-4 md:gap-8", isMobileMenuOpen && "hidden md:flex")}
      >
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <TabsList className="flex flex-col h-auto w-full justify-start bg-transparent p-0 gap-2 overflow-visible">
            <TabsTrigger 
              value="appearance" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Palette className="h-4 w-4" />
              Wygląd
            </TabsTrigger>
            <TabsTrigger 
              value="general" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Settings className="h-4 w-4" />
              Ogólne
            </TabsTrigger>
            <TabsTrigger 
              value="documentation" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <BookOpen className="h-4 w-4" />
              Dokumentacja
            </TabsTrigger>
            <TabsTrigger 
              value="mobile-menu" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Smartphone className="h-4 w-4" />
              Menu Mobilne
            </TabsTrigger>
            <TabsTrigger 
              value="kpi" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Activity className="h-4 w-4" />
              KPI / Alerty
            </TabsTrigger>
            <TabsTrigger 
              value="portal" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageSquare className="h-4 w-4" />
              Portal & SMS
            </TabsTrigger>
            <TabsTrigger 
              value="contracts" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <FileText className="h-4 w-4" />
              Umowy
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Globe className="h-4 w-4" />
              Integracje
            </TabsTrigger>
            <TabsTrigger 
              value="wp-changes" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Zmiany WP
            </TabsTrigger>
            <TabsTrigger 
              value="montage" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Activity className="h-4 w-4" />
              Montaże
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Activity className="h-4 w-4" />
              Logi systemowe
            </TabsTrigger>
            <TabsTrigger 
              value="trash" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" />
              Kosz
            </TabsTrigger>
          </TabsList>
        </aside>

        <div className="flex-1 max-w-4xl space-y-4">
          <TabsContent value="appearance" className="m-0 space-y-4">
            {appearance}
          </TabsContent>

          <TabsContent value="general" className="m-0 space-y-4">
              {children}
          </TabsContent>

          <TabsContent value="team" className="m-0 space-y-4">
            {teamSettings}
          </TabsContent>

          <TabsContent value="documentation" className="m-0 space-y-4">
            {documentation}
          </TabsContent>

          <TabsContent value="mobile-menu" className="m-0 space-y-4">
            {mobileMenuSettings}
          </TabsContent>

          <TabsContent value="kpi" className="m-0 space-y-4">
            {kpiSettings}
          </TabsContent>

          <TabsContent value="portal" className="m-0 space-y-4">
            {portalSettings}
          </TabsContent>

          <TabsContent value="contracts" className="m-0 space-y-4">
            {contractTemplatesManager}
          </TabsContent>

          <TabsContent value="trash" className="m-0 space-y-4">
            {trash}
          </TabsContent>

          <TabsContent value="integrations" className="m-0 space-y-4">
            {integrations}
          </TabsContent>

          <TabsContent value="wp-changes" className="m-0 space-y-4">
            {wpChanges}
          </TabsContent>

          <TabsContent value="montage" className="m-0 space-y-4">
            {montageSettings}
          </TabsContent>

          <TabsContent value="logs" className="m-0 space-y-4">
            {logs}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
