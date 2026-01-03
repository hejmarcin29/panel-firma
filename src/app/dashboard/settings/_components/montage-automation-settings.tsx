'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Zap, Plus, Trash2, Pencil, Check, X, ListTodo, User } from 'lucide-react';

import type { MontageChecklistTemplate, UserRole } from '@/lib/montaze/checklist-shared';
import type { MontageAutomationRule } from '@/lib/montaze/automation';
import type { StatusOption } from '../../crm/montaze/types';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import { updateMontageAutomationSettings, updateMontageChecklistTemplates, updateRequireInstallerForMeasurement } from '../actions';

import { MontageProcessMap } from '../../crm/montaze/[montageId]/_components/montage-process-map';

interface MontageAutomationSettingsProps {
  templates: MontageChecklistTemplate[];
  initialRules: MontageAutomationRule[];
  statusOptions: StatusOption[];
  initialSettings: Record<string, boolean>;
  requireInstallerForMeasurement: boolean;
}

export function MontageAutomationSettings({ templates: initialTemplates, statusOptions, initialSettings, requireInstallerForMeasurement }: MontageAutomationSettingsProps) {
  const [settings, setSettings] = useState<Record<string, boolean>>(initialSettings);
  const [requireInstaller, setRequireInstaller] = useState(requireInstallerForMeasurement);
  const [templates, setTemplates] = useState<MontageChecklistTemplate[]>(initialTemplates);
  const [isPending, startTransition] = useTransition();
  
  // Checklist Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editRole, setEditRole] = useState<UserRole | undefined>(undefined);
  const [newItemLabels, setNewItemLabels] = useState<Record<string, string>>({});
  const [newItemRoles, setNewItemRoles] = useState<Record<string, UserRole | undefined>>({});

  const handleRequireInstallerToggle = (checked: boolean) => {
      setRequireInstaller(checked);
      startTransition(async () => {
          try {
              await updateRequireInstallerForMeasurement(checked);
              toast.success("Zaktualizowano ustawienie.");
          } catch {
              toast.error("Błąd zapisu.");
              setRequireInstaller(!checked);
          }
      });
  };

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
          associatedStage: stageId,
          assignedRole: newItemRoles[stageId]
      };

      const newTemplates = [...templates, newItem];
      saveTemplates(newTemplates);
      setNewItemLabels(prev => ({ ...prev, [stageId]: '' }));
      setNewItemRoles(prev => ({ ...prev, [stageId]: undefined }));
  };

  const handleDeleteItem = (itemId: string) => {
      if (itemId === 'protocol_signed') {
          toast.error("Nie można usunąć tego elementu, ponieważ jest on wymagany przez automatyzację systemową.");
          return;
      }
      if (!confirm("Czy na pewno chcesz usunąć ten element z szablonu?")) return;
      const newTemplates = templates.filter(t => t.id !== itemId);
      saveTemplates(newTemplates);
  };

  const startEditing = (item: MontageChecklistTemplate) => {
      setEditingId(item.id);
      setEditLabel(item.label);
      setEditRole(item.assignedRole);
  };

  const saveEditing = () => {
      if (!editingId || !editLabel.trim()) return;
      
      const newTemplates = templates.map(t => 
          t.id === editingId ? { ...t, label: editLabel.trim(), assignedRole: editRole } : t
      );
      
      saveTemplates(newTemplates);
      setEditingId(null);
      setEditLabel('');
      setEditRole(undefined);
  };

  const isEnabled = (id: string) => settings[id] ?? true; // Default to true if not set

  return (
    <div className="space-y-6">
        {/* General Settings */}
        <Card>
            <CardHeader>
                <CardTitle>Ustawienia Ogólne</CardTitle>
                <CardDescription>Konfiguracja zachowania procesu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <span className="font-medium">Wymagaj montażysty do pomiaru</span>
                        <span className="text-sm text-muted-foreground">
                            Blokuj zlecenie pomiaru (Lead -&gt; Pomiar), jeśli nie przypisano montażysty.
                        </span>
                    </div>
                    <Switch 
                        checked={requireInstaller}
                        onCheckedChange={handleRequireInstallerToggle}
                        disabled={isPending}
                    />
                </div>
            </CardContent>
        </Card>

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
                // Exclude 'lead_verification' from auto-advance UI as it requires manual conversion dialog
                const showAutoAdvance = hasChecklistItems && nextStatusOption && step.id !== 'lead_verification';
                const autoAdvanceId = `auto_advance_${step.id}`;

                // Show card if there are automations OR if it's a valid stage for checklist (has primaryStatus)
                if (stepAutomations.length === 0 && !primaryStatus) return null;

                return (
                    <Card key={step.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base mr-2">{step.label}</CardTitle>
                                <Badge variant="outline" className="text-xs text-slate-500 font-normal" title="ID Kroku Procesu">
                                    Step: {step.id}
                                </Badge>
                                {primaryStatus && (
                                    <Badge variant="secondary" className="text-xs font-mono" title="ID Statusu w Bazie (DB)">
                                        Status: {primaryStatus}
                                    </Badge>
                                )}
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
                                                            className="h-8 flex-1"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                                                        />
                                                        <Select 
                                                            value={editRole || 'all'} 
                                                            onValueChange={(val) => setEditRole(val === 'all' ? undefined : val as UserRole)}
                                                        >
                                                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                                                <SelectValue placeholder="Rola" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">Wszyscy</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="office">Biuro</SelectItem>
                                                                <SelectItem value="measurer">Pomiarowiec</SelectItem>
                                                                <SelectItem value="installer">Montażysta</SelectItem>
                                                            </SelectContent>
                                                        </Select>
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
                                                            <div className="flex items-center gap-2">
                                                                <span>{item.label}</span>
                                                                {item.assignedRole && (
                                                                    <Badge variant="outline" className="text-[10px] bg-slate-50">
                                                                        <User className="w-3 h-3 mr-1" />
                                                                        {item.assignedRole === 'admin' ? 'Admin' :
                                                                         item.assignedRole === 'office' ? 'Biuro' :
                                                                         item.assignedRole === 'measurer' ? 'Pomiarowiec' :
                                                                         item.assignedRole === 'installer' ? 'Montażysta' : item.assignedRole}
                                                                    </Badge>
                                                                )}
                                                                {item.id === 'protocol_signed' && (
                                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                                                                        <Bot className="w-3 h-3" /> Auto
                                                                    </Badge>
                                                                )}
                                                                {['advance_invoice_issued', 'advance_invoice_paid', 'contract_signed_check', 'final_invoice_issued', 'final_invoice_paid'].includes(item.id) && (
                                                                    <Badge variant="outline" className="text-slate-500 font-normal text-[10px]">
                                                                        Manual
                                                                    </Badge>
                                                                )}
                                                            </div>
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
                                                className="h-8 text-sm flex-1"
                                                value={newItemLabels[primaryStatus] || ''}
                                                onChange={(e) => setNewItemLabels(prev => ({ ...prev, [primaryStatus]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(primaryStatus)}
                                            />
                                            <Select 
                                                value={newItemRoles[primaryStatus] || 'all'} 
                                                onValueChange={(val) => setNewItemRoles(prev => ({ ...prev, [primaryStatus]: val === 'all' ? undefined : val as UserRole }))}
                                            >
                                                <SelectTrigger className="h-8 w-[130px] text-xs">
                                                    <SelectValue placeholder="Rola" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Wszyscy</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="office">Biuro</SelectItem>
                                                    <SelectItem value="measurer">Pomiarowiec</SelectItem>
                                                    <SelectItem value="installer">Montażysta</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                                        Gdy wszystkie zadania zostaną wykonane, status zmieni się automatycznie. <br/>
                                                        <span className="text-amber-600 font-medium">Uwaga:</span> Odznaczenie zadania spowoduje cofnięcie statusu.
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
