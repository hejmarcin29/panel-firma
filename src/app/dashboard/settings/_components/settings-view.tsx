'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Mail, Database, Activity, Globe } from 'lucide-react';

interface SettingsViewProps {
  children: React.ReactNode;
  mailSettings: React.ReactNode;
  logs: React.ReactNode;
  integrations: React.ReactNode;
  storage: React.ReactNode;
  montageSettings: React.ReactNode;
  calendarSettings: React.ReactNode;
}

export function SettingsView({ children, mailSettings, logs, integrations, storage, montageSettings, calendarSettings }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
        <p className="text-sm text-muted-foreground">
          Zarządzaj konfiguracją aplikacji, integracjami i kontami pocztowymi.
        </p>
      </div>

      <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <TabsList className="flex flex-row md:flex-col h-auto w-full justify-start bg-transparent p-0 gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <TabsTrigger 
              value="general" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Settings className="h-4 w-4" />
              Ogólne
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Calendar className="h-4 w-4" />
              Kalendarz
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Globe className="h-4 w-4" />
              Integracje
            </TabsTrigger>
            <TabsTrigger 
              value="mail" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Mail className="h-4 w-4" />
              Poczta
            </TabsTrigger>
            <TabsTrigger 
              value="montage" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Activity className="h-4 w-4" />
              Montaże
            </TabsTrigger>
            <TabsTrigger 
              value="storage" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Database className="h-4 w-4" />
              Magazyn plików
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="w-full justify-start gap-2 px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:shadow-none ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Activity className="h-4 w-4" />
              Logi systemowe
            </TabsTrigger>
          </TabsList>
        </aside>

        <div className="flex-1 max-w-4xl space-y-4">
          <TabsContent value="general" className="m-0 space-y-4">
              {children}
          </TabsContent>

          <TabsContent value="calendar" className="m-0 space-y-4">
            {calendarSettings}
          </TabsContent>

          <TabsContent value="integrations" className="m-0 space-y-4">
            {integrations}
          </TabsContent>

          <TabsContent value="mail" className="m-0 space-y-4">
            {mailSettings}
          </TabsContent>

          <TabsContent value="montage" className="m-0 space-y-4">
            {montageSettings}
          </TabsContent>

          <TabsContent value="storage" className="m-0 space-y-4">
            {storage}
          </TabsContent>

          <TabsContent value="logs" className="m-0 space-y-4">
            {logs}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
