'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { updateMontageAutomationRulesAction } from '../actions';
import type { MontageChecklistTemplate } from '@/lib/montaze/checklist';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { MontageStatus } from '@/lib/db/schema';
import type { StatusOption } from '../../montaze/types';

interface MontageAutomationSettingsProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
}

export function MontageAutomationSettings({ templates, initialRules, statusOptions }: MontageAutomationSettingsProps) {
  const [rules, setRules] = useState<MontageAutomationRule[]>(initialRules);
  const [isPending, startTransition] = useTransition();

  const getRuleForTemplate = (templateId: string) => {
    return rules.find(r => r.checklistItemId === templateId)?.targetStatus || 'none';
  };

  const handleRuleChange = (templateId: string, value: string) => {
    const newRules = rules.filter(r => r.checklistItemId !== templateId);
    if (value !== 'none') {
      newRules.push({
        checklistItemId: templateId,
        targetStatus: value as MontageStatus,
      });
    }
    setRules(newRules);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateMontageAutomationRulesAction(rules);
        toast.success("Zapisano reguły automatyzacji.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatyzacja statusów</CardTitle>
        <CardDescription>
          Automatycznie zmieniaj status montażu po wykonaniu określonego etapu (zaznaczeniu checkboxa).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex-1">
                <Label className="text-base">{template.label}</Label>
              </div>
              
              <div className="flex items-center gap-4">
                <ArrowRight className="text-muted-foreground h-4 w-4" />
                <Select
                  value={getRuleForTemplate(template.id)}
                  onValueChange={(value) => handleRuleChange(template.id, value)}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Nie zmieniaj statusu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nie zmieniaj statusu</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Najpierw zdefiniuj etapy w sekcji &quot;Szablony etapów montażu&quot;.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Zapisywanie..." : "Zapisz reguły"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
