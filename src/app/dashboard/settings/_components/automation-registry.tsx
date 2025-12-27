'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
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

interface AutomationRegistryProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
  initialNotifications: Record<string, boolean>;
  initialAutomationSettings: Record<string, boolean>;
}

export function AutomationRegistry({ templates, initialRules, statusOptions, initialNotifications, initialAutomationSettings }: AutomationRegistryProps) {
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
            
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Wyzwalacz</TableHead>
                                <TableHead>Akcja</TableHead>
                                <TableHead>Odbiorca</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SYSTEM_NOTIFICATIONS.map((notif) => {
                                const enabled = isEnabled(notif.id, notif.defaultEnabled);
                                return (
                                <TableRow key={notif.id}>
                                    <TableCell>
                                        {notif.type === 'sms' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                                        {notif.type === 'email' && <Mail className="h-4 w-4 text-yellow-500" />}
                                        {notif.type === 'calendar' && <Calendar className="h-4 w-4 text-green-500" />}
                                        {notif.type === 'system' && <Bot className="h-4 w-4 text-purple-500" />}
                                    </TableCell>
                                    <TableCell className="font-medium">{notif.trigger}</TableCell>
                                    <TableCell>{notif.action}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{notif.recipient}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`text-xs ${enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                {enabled ? 'Aktywne' : 'Wyłączone'}
                                            </span>
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
        </div>
    </div>
  );
}
