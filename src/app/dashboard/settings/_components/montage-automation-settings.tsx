'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap } from 'lucide-react';

import type { MontageChecklistTemplate } from '@/lib/montaze/checklist-shared';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';

import { MontageProcessMap } from '../../crm/montaze/[montageId]/_components/montage-process-map';

interface MontageAutomationSettingsProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[]; // Kept for compatibility but unused
  statusOptions: StatusOption[];
}

export function MontageAutomationSettings({ templates, statusOptions }: MontageAutomationSettingsProps) {
  
  // 1. Automatyzacje przejść statusów (na podstawie checklist)
  const statusAutomationRows = statusOptions.map((status, index) => {
    const nextStatus = statusOptions[index + 1];
    if (!nextStatus) return null;

    // Check if this stage has any checklist items associated
    const hasChecklistItems = templates.some(t => t.associatedStage === status.value);
    
    if (!hasChecklistItems) return null;

    return {
      id: `status-${status.value}`,
      trigger: `Ukończenie etapu: ${status.label}`,
      action: `Zmiana statusu na: ${nextStatus.label}`,
      description: 'Automatyczne przejście po wykonaniu wszystkich zadań.',
      recipient: 'System',
      type: 'status' as const
    };
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  // 2. Automatyzacje procesowe (z definicji procesu)
  const processAutomationRows = PROCESS_STEPS.flatMap(step => 
    step.automations.map((auto, idx) => ({
      id: `process-${step.id}-${idx}`,
      trigger: `Etap: ${step.label}`,
      action: auto.label,
      description: auto.description || 'Akcja systemowa',
      recipient: 'System/Użytkownik',
      type: 'process' as const
    }))
  );

  const allAutomations = [...statusAutomationRows, ...processAutomationRows];

  return (
    <div className="space-y-6">
        {/* Process Map Visualization Placeholder */}
        <Card className="bg-slate-50 border-slate-200 overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-blue-600" />
                            Mapa Procesu (Podgląd)
                        </CardTitle>
                        <CardDescription>
                            Wizualizacja przepływu pracy i punktów automatyzacji.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white">v1.0</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <MontageProcessMap />
            </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle>Lista Reguł Automatyzacji</CardTitle>
            <CardDescription>
            Szczegółowy wykaz aktywnych reguł, powiadomień i akcji systemowych.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Wyzwalacz / Etap</TableHead>
                        <TableHead>Akcja</TableHead>
                        <TableHead>Opis</TableHead>
                        <TableHead className="text-right">Typ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allAutomations.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell>
                                {row.type === 'status' ? (
                                    <Bot className="h-4 w-4 text-purple-500" />
                                ) : (
                                    <Zap className="h-4 w-4 text-amber-500" />
                                )}
                            </TableCell>
                            <TableCell className="font-medium">{row.trigger}</TableCell>
                            <TableCell>{row.action}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {row.description}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant={row.type === 'status' ? 'outline' : 'secondary'}>
                                    {row.type === 'status' ? 'Workflow' : 'Akcja'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                    {allAutomations.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                Brak zdefiniowanych automatyzacji.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
