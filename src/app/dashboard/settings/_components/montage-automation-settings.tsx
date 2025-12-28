'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Zap, Plus, Trash2, Pencil, Check, X, ListTodo } from 'lucide-react';

import type { MontageChecklistTemplate } from '@/lib/montaze/checklist-shared';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import { updateMontageAutomationSettings, updateMontageChecklistTemplates } from '../actions';

import { MontageProcessMap } from '../../crm/montaze/[montageId]/_components/montage-process-map';

interface MontageAutomationSettingsProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
  initialSettings: Record<string, boolean>;
}

export function MontageAutomationSettings({ templates: initialTemplates, statusOptions, initialSettings }: MontageAutomationSettingsProps) {
  const [settings, setSettings] = useState<Record<string, boolean>>(initialSettings);
  const [templates, setTemplates] = useState<MontageChecklistTemplate[]>(initialTemplates);
  const [isPending, startTransition] = useTransition();
  
  // Checklist Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [newItemLabels, setNewItemLabels] = useState<Record<string, string>>({});

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

  const saveTemplates = async (newTemplates: MontageChecklistTemplate[]) => {
      setTemplates(newTemplates);
      try {
          await updateMontageChecklistTemplates(newTemplates);
          toast.success("Zaktualizowano szablon checklisty.");
      } catch {
          toast.error("Błąd zapisu szablonu.");
          setTemplates(templates); // Revert
      }
  };

  const handleAddItem = (stageId: string) => {
      const label = newItemLabels[stageId]?.trim();
      if (!label) return;

      const newItem: MontageChecklistTemplate = {
          id: crypto.randomUUID(),
          label,
          allowAttachment: false,
          associatedStage: stageId
      };

      const newTemplates = [...templates, newItem];
      saveTemplates(newTemplates);
      setNewItemLabels(prev => ({ ...prev, [stageId]: '' }));
  };

  const handleDeleteItem = (itemId: string) => {
      if (!confirm("Czy na pewno chcesz usunąć ten element z szablonu?")) return;
      const newTemplates = templates.filter(t => t.id !== itemId);
      saveTemplates(newTemplates);
  };

  const startEditing = (item: MontageChecklistTemplate) => {
      setEditingId(item.id);
      setEditLabel(item.label);
  };

  const saveEditing = () => {
      if (!editingId || !editLabel.trim()) return;
      
      const newTemplates = templates.map(t => 
          t.id === editingId ? { ...t, label: editLabel.trim() } : t
      );
      
      saveTemplates(newTemplates);
      setEditingId(null);
      setEditLabel('');
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
                
                const stepTemplates = templates.filter(t => t.associatedStage === primaryStatus);
                const hasChecklistItems = stepTemplates.length > 0;
                const showAutoAdvance = hasChecklistItems && nextStatusOption;
                const autoAdvanceId = `auto_advance_${step.id}`;

                // Show card if there are automations OR if it's a valid stage for checklist (has primaryStatus)
                if (stepAutomations.length === 0 && !primaryStatus) return null;

                return (
                    <Card key={step.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{step.id}</Badge>
                                <CardTitle className="text-base">{step.label}</CardTitle>
                            </div>
                            <CardDescription>{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            
                            {/* Checklist Editor Section */}
                            {primaryStatus && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <ListTodo className="w-4 h-4" />
                                        Lista zadań (Checklista)
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {stepTemplates.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 group">
                                                {editingId === item.id ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Input 
                                                            value={editLabel} 
                                                            onChange={(e) => setEditLabel(e.target.value)}
                                                            className="h-8"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEditing}>
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 text-sm border rounded px-3 py-1.5 bg-white flex items-center justify-between">
                                                            <span>{item.label}</span>
                                                            {item.allowAttachment && <Badge variant="secondary" className="text-[10px]">Załącznik</Badge>}
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => startEditing(item)}>
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => handleDeleteItem(item.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input 
                                                placeholder="Dodaj nowe zadanie..." 
                                                className="h-8 text-sm"
                                                value={newItemLabels[primaryStatus] || ''}
                                                onChange={(e) => setNewItemLabels(prev => ({ ...prev, [primaryStatus]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(primaryStatus)}
                                            />
                                            <Button size="sm" variant="outline" onClick={() => handleAddItem(primaryStatus)}>
                                                <Plus className="w-4 h-4 mr-1" /> Dodaj
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Automation Section */}
                            {(showAutoAdvance || stepAutomations.length > 0) && (
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Bot className="w-4 h-4" />
                                        Automatyzacja
                                    </div>

                                    {showAutoAdvance && (
                                        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 bg-slate-50/50">
                                            <div className="flex items-center space-x-4">
                                                <div className="space-y-0.5">
                                                    <div className="font-medium text-sm">Automatyczne przejście do: {nextStatusOption.label}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Gdy wszystkie zadania z powyższej listy zostaną wykonane (lub oznaczone jako &quot;nie dotyczy&quot;).
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
                                                    <div className="font-medium text-sm">{auto.label}</div>
                                                    <div className="text-xs text-muted-foreground">
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
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    </div>
  );
}
