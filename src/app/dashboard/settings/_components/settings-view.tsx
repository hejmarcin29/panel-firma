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
}

export function SettingsView({ children, mailSettings, logs, integrations, storage, montageSettings }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
        <p className="text-sm text-muted-foreground">
          Zarządzaj konfiguracją aplikacji, integracjami i kontami pocztowymi.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Ogólne
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Globe className="h-4 w-4" />
            Integracje
          </TabsTrigger>
          <TabsTrigger value="mail" className="gap-2">
            <Mail className="h-4 w-4" />
            Poczta
          </TabsTrigger>
          <TabsTrigger value="montage" className="gap-2">
            <Activity className="h-4 w-4" />
            Montaże
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <Database className="h-4 w-4" />
            Magazyn plików
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Logi systemowe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
            {children}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          {integrations}
        </TabsContent>

        <TabsContent value="mail" className="space-y-4">
          {mailSettings}
        </TabsContent>

        <TabsContent value="montage" className="space-y-4">
          {montageSettings}
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          {storage}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {logs}
        </TabsContent>
      </Tabs>
    </div>
  );
}
