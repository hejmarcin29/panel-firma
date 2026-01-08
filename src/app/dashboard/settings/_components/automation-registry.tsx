'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Mail, Calendar, Bot } from 'lucide-react';
import { MontageAutomationSettings } from './montage-automation-settings';
import type { MontageChecklistTemplate } from '@/lib/montaze/checklist-shared';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';
import { SYSTEM_NOTIFICATIONS } from '@/lib/montaze/notifications';
import { updateMontageNotificationsAction } from '../actions';
import { PortalTimelineDocs } from '../automations/_components/portal-timeline-docs';
import { SampleOrderSettings } from './sample-order-settings';

interface AutomationRegistryProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
  initialNotifications: Record<string, boolean>;
  initialAutomationSettings: Record<string, boolean>;
  requireInstallerForMeasurement: boolean;
  sampleSettings?: {
      notificationEmail: string | null;
      confirmationSubject: string | null;
      confirmationTemplate: string | null;
  };
}

export function AutomationRegistry({ 
    templates, 
    initialRules, 
    statusOptions, 
    initialNotifications,
    initialAutomationSettings,
    requireInstallerForMeasurement,
    sampleSettings
}: AutomationRegistryProps) {

    const [notifications, setNotifications] = useState<Record<string, boolean>>(initialNotifications);
    const [isPending, startTransition] = useTransition();

    const handleToggle = (id: string, checked: boolean) => {
        const next = { ...notifications, [id]: checked };
        setNotifications(next);
        
        startTransition(async () => {
            try {
                await updateMontageNotificationsAction(next);
                toast.success("Zaktualizowano ustawienia powiadomień.");
            } catch {
                toast.error("Błąd zapisu ustawień.");
                // Revert on error
                setNotifications(notifications);
            }
        });
    };

    const isEnabled = (id: string, defaultEnabled: boolean) => {
        return notifications[id] ?? defaultEnabled;
    };

  return (
    <div className="space-y-8">
        {/* Section 1: Process Automation (Editable) */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Automatyzacja Procesu (Workflow)</h3>
                    <p className="text-sm text-muted-foreground">
                        Reguły automatycznej zmiany statusu na podstawie checklisty.
                    </p>
                </div>
            </div>
            <MontageAutomationSettings 
                templates={templates} 
                initialRules={initialRules} 
                statusOptions={statusOptions} 
                initialSettings={initialAutomationSettings}
                requireInstallerForMeasurement={requireInstallerForMeasurement}
            />
        </div>

        {/* Section 2: System Notifications (Toggleable) */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Powiadomienia i Integracje</h3>
                    <p className="text-sm text-muted-foreground">
                        Włącz lub wyłącz automatyczne powiadomienia i akcje systemowe.
                    </p>
                </div>
            </div>
            
            <div className="grid gap-6">
                {/* Group by Type */}
                {['sms', 'email', 'calendar', 'system'].map(type => {
                    const notifications = SYSTEM_NOTIFICATIONS.filter(n => !n.locked && n.type === type);
                    if (notifications.length === 0) return null;

                    const typeLabels: Record<string, string> = {
                        sms: 'Powiadomienia SMS',
                        email: 'Powiadomienia E-mail',
                        calendar: 'Kalendarz',
                        system: 'Integracje Systemowe'
                    };

                    return (
                        <Card key={type}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    {type === 'sms' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                                    {type === 'email' && <Mail className="h-4 w-4 text-yellow-500" />}
                                    {type === 'calendar' && <Calendar className="h-4 w-4 text-green-500" />}
                                    {type === 'system' && <Bot className="h-4 w-4 text-purple-500" />}
                                    {typeLabels[type]}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Wyzwalacz</TableHead>
                                            <TableHead>Akcja</TableHead>
                                            <TableHead>Odbiorca</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {notifications.map((notif) => {
                                            const enabled = isEnabled(notif.id, notif.defaultEnabled);
                                            return (
                                            <TableRow key={notif.id}>
                                                <TableCell className="font-medium">{notif.trigger}</TableCell>
                                                <TableCell>{notif.action}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{notif.recipient}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Switch 
                                                            checked={enabled}
                                                            onCheckedChange={(checked) => handleToggle(notif.id, checked)}
                                                            disabled={isPending}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            {/* Section 2b: Sample Orders */}
            <SampleOrderSettings initialSettings={sampleSettings} />
        </div>
        {/* Section 3: Customer Portal Timeline Docs */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Panel Klienta - Oś Czasu</h3>
                    <p className="text-sm text-muted-foreground">
                        Dokumentacja logiki wyświetlania postępu w panelu klienta.
                    </p>
                </div>
            </div>
            <PortalTimelineDocs />
        </div>
    </div>
  );
}
