'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

import type { MontageChecklistTemplate } from '@/lib/montaze/checklist-shared';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';

interface MontageAutomationSettingsProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[]; // Kept for compatibility but unused
  statusOptions: StatusOption[];
}

export function MontageAutomationSettings({ templates, statusOptions }: MontageAutomationSettingsProps) {
  
  const automationRows = statusOptions.map((status, index) => {
    const nextStatus = statusOptions[index + 1];
    if (!nextStatus) return null;

    // Check if this stage has any checklist items associated
    const hasChecklistItems = templates.some(t => t.associatedStage === status.value);
    
    if (!hasChecklistItems) return null;

    return {
      id: status.value,
      trigger: `Ukończenie etapu: ${status.label}`,
      action: `Zmiana statusu na: ${nextStatus.label}`,
      recipient: 'System',
      status: 'Wbudowane'
    };
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatyzacja statusów</CardTitle>
        <CardDescription>
          System automatycznie zmienia status montażu po wykonaniu wszystkich zadań z danego etapu.
        </CardDescription>
      </CardHeader>
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
                {automationRows.map((row) => (
                    <TableRow key={row.id}>
                        <TableCell>
                            <Bot className="h-4 w-4 text-purple-500" />
                        </TableCell>
                        <TableCell className="font-medium">{row.trigger}</TableCell>
                        <TableCell>{row.action}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{row.recipient}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="text-xs text-green-600 font-medium">
                                {row.status}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
                {automationRows.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                            Brak zdefiniowanych etapów z automatyzacją.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
