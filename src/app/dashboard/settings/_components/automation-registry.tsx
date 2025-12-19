'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Mail, Calendar, Bot } from 'lucide-react';
import { MontageAutomationSettings } from './montage-automation-settings';
import type { MontageChecklistTemplate } from '@/lib/montaze/checklist';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';

interface AutomationRegistryProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
}

type SystemNotification = {
    id: string;
    type: 'sms' | 'email' | 'calendar' | 'system';
    trigger: string;
    action: string;
    recipient: string;
    status: 'active' | 'inactive';
};

const SYSTEM_NOTIFICATIONS: SystemNotification[] = [
    {
        id: 'sms_measurement_request',
        type: 'sms',
        trigger: 'Ręczne kliknięcie "Wyślij prośbę o pomiar"',
        action: 'Wysyła SMS: "Dzień dobry, prosimy o kontakt..."',
        recipient: 'Klient',
        status: 'active'
    },
    {
        id: 'calendar_create',
        type: 'calendar',
        trigger: 'Utworzenie montażu z datą szacowaną',
        action: 'Tworzy wydarzenie w Google Calendar',
        recipient: 'Kalendarz Firmowy + Montażysta',
        status: 'active'
    },
    {
        id: 'calendar_update',
        type: 'calendar',
        trigger: 'Zmiana daty montażu lub przypisanie montażysty',
        action: 'Aktualizuje wydarzenie w Google Calendar',
        recipient: 'Kalendarz Firmowy + Montażysta',
        status: 'active'
    },
    {
        id: 'log_history',
        type: 'system',
        trigger: 'Każda kluczowa akcja (edycja, status, checklista)',
        action: 'Zapisuje wpis w Historii Zdarzeń',
        recipient: 'System Logs',
        status: 'active'
    },
    {
        id: 'commission_architect',
        type: 'system',
        trigger: 'Zmiana statusu na "Zakończono" (jeśli jest architekt)',
        action: 'Nalicza prowizję dla architekta',
        recipient: 'Portfel Architekta',
        status: 'active'
    }
];

export function AutomationRegistry({ templates, initialRules, statusOptions }: AutomationRegistryProps) {
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
            />
        </div>

        {/* Section 2: System Notifications (Read-only for now) */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Powiadomienia i Integracje</h3>
                    <p className="text-sm text-muted-foreground">
                        Rejestr automatycznych powiadomień i akcji systemowych (Hardcoded).
                    </p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Rejestr Zdarzeń Systemowych</CardTitle>
                    <CardDescription>
                        Lista akcji wykonywanych automatycznie przez kod aplikacji.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Wyzwalacz (Trigger)</TableHead>
                                <TableHead>Akcja</TableHead>
                                <TableHead>Odbiorca</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SYSTEM_NOTIFICATIONS.map((notif) => (
                                <TableRow key={notif.id}>
                                    <TableCell>
                                        {notif.type === 'sms' && <MessageSquare className="h-4 w-4 text-purple-500" />}
                                        {notif.type === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                                        {notif.type === 'calendar' && <Calendar className="h-4 w-4 text-green-500" />}
                                        {notif.type === 'system' && <Bot className="h-4 w-4 text-gray-500" />}
                                    </TableCell>
                                    <TableCell className="font-medium">{notif.trigger}</TableCell>
                                    <TableCell>{notif.action}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{notif.recipient}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={notif.status === 'active' ? 'default' : 'secondary'}>
                                            {notif.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
