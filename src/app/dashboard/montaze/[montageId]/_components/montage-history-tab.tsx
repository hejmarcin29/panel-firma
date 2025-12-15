"use client";

import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Montage } from "../../types";

type SystemLog = {
    id: string;
    action: string;
    details: string | null;
    createdAt: number | Date;
    userId: string | null;
};

const ACTION_LABELS: Record<string, string> = {
    'create_montage': 'Utworzono',
    'create_lead': 'Utworzono lead',
    'update_montage_status': 'Zmiana statusu',
    'update_montage_automation': 'Automatyzacja',
    'update_montage_statuses': 'Edycja statusów',
    'update_webhook_secret': 'Webhook',
    'update_r2_config': 'Konfiguracja R2',
    'update_montage_templates': 'Szablony',
    'montage.update_realization_status': 'Status realizacji',
    'montage.update_material_status': 'Status materiału',
    'montage.update_installer_status': 'Status montażysty',
};

export function MontageHistoryTab({ montage, logs = [] }: { montage: Montage; logs?: SystemLog[] }) {
  return (
    <div className="flex flex-col h-[600px] py-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-4">
        {logs.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
                Brak historii zdarzeń.
            </div>
        )}
        {logs.map((log) => (
            <div key={log.id} className="flex gap-3 items-center">
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">System</span>
                        <span className="text-xs text-muted-foreground">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">
                            {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                        {(() => {
                            if (!log.details) return null;
                            let text = log.details;
                            text = text.replace(`Zaktualizowano status realizacji dla montażu ${montage.id}: `, '');
                            text = text.replace(` [${montage.id}]`, '');
                            return text.replace(montage.id, montage.displayId ? `${montage.displayId} (${montage.clientName})` : montage.clientName);
                        })()}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
