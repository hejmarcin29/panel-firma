'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Zap } from 'lucide-react';

import type { MontageChecklistTemplate } from '@/lib/montaze/checklist-shared';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import { updateMontageAutomationSettings } from '../actions';

import { MontageProcessMap } from '../../crm/montaze/[montageId]/_components/montage-process-map';

interface MontageAutomationSettingsProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
  initialSettings: Record<string, boolean>;
}

export function MontageAutomationSettings({ templates, statusOptions, initialSettings }: MontageAutomationSettingsProps) {
  const [settings, setSettings] = useState<Record<string, boolean>>(initialSettings);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, checked: boolean) => {
    const next = { ...settings, [id]: checked };
    setSettings(next);
    
    startTransition(async () => {
        try {
            await updateMontageAutomationSettings(next);
            toast.success("Zaktualizowano ustawienia automatyzacji.");
        } catch {
            toast.error("Błąd zapisu ustawień.");
            setSettings(settings); // Revert
        }
    });
  };

  const isEnabled = (id: string) => settings[id] ?? true; // Default to true if not set

  return (
    <div className="space-y-6">
        {/* Process Map Visualization */}
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

        <div className="grid gap-6">
            {PROCESS_STEPS.map((step) => {
                // Filter automations for this step
                const stepAutomations = step.automations;
                
                // Check for status transition automation
                const primaryStatus = step.relatedStatuses[0];
                const statusIndex = statusOptions.findIndex(s => s.value === primaryStatus);
                const nextStatusOption = statusOptions[statusIndex + 1];
                
                const hasChecklistItems = templates.some(t => t.associatedStage === primaryStatus);
                const showAutoAdvance = hasChecklistItems && nextStatusOption;
                const autoAdvanceId = `auto_advance_${step.id}`;

                if (stepAutomations.length === 0 && !showAutoAdvance) return null;

                return (
                    <Card key={step.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{step.id}</Badge>
                                <CardTitle className="text-base">{step.label}</CardTitle>
                            </div>
                            <CardDescription>{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {showAutoAdvance && (
                                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 bg-slate-50/50">
                                    <div className="flex items-center space-x-4">
                                        <Bot className="h-5 w-5 text-purple-500" />
                                        <div className="space-y-0.5">
                                            <div className="font-medium">Automatyczne przejście do: {nextStatusOption.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Po wykonaniu wszystkich zadań z checklisty.
                                            </div>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={isEnabled(autoAdvanceId)}
                                        onCheckedChange={(c) => handleToggle(autoAdvanceId, c)}
                                        disabled={isPending}
                                    />
                                </div>
                            )}

                            {stepAutomations.map((auto, idx) => (
                                <div key={auto.id || idx} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                    <div className="flex items-center space-x-4">
                                        <Zap className="h-5 w-5 text-amber-500" />
                                        <div className="space-y-0.5">
                                            <div className="font-medium">{auto.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {auto.description}
                                            </div>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={isEnabled(auto.id)}
                                        onCheckedChange={(c) => handleToggle(auto.id, c)}
                                        disabled={isPending}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    </div>
  );
}
