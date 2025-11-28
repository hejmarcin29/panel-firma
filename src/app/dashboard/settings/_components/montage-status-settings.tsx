'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { updateMontageStatusDefinitionsAction } from '../actions';
import type { MontageStatusDefinition } from '@/lib/montaze/statuses';

interface MontageStatusSettingsProps {
  initialStatuses: MontageStatusDefinition[];
}

export function MontageStatusSettings({ initialStatuses }: MontageStatusSettingsProps) {
  const [statuses, setStatuses] = useState<MontageStatusDefinition[]>(initialStatuses);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setStatuses([
      ...statuses,
      {
        id: crypto.randomUUID(),
        label: '',
        description: '',
        order: statuses.length,
        isSystem: false,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const status = statuses[index];
    if (status.isSystem) {
      toast.error("Nie można usunąć statusu systemowego.");
      return;
    }
    const next = [...statuses];
    next.splice(index, 1);
    setStatuses(next);
  };

  const handleChange = (index: number, field: keyof MontageStatusDefinition, value: string) => {
    const next = [...statuses];
    next[index] = { ...next[index], [field]: value };
    setStatuses(next);
  };

  const handleSave = () => {
    if (statuses.some(s => !s.label.trim())) {
      toast.error("Wszystkie statusy muszą mieć nazwę.");
      return;
    }

    startTransition(async () => {
      try {
        await updateMontageStatusDefinitionsAction(statuses);
        toast.success("Zapisano definicje statusów.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statusy montażu</CardTitle>
        <CardDescription>
          Zarządzaj statusami dostępnymi w procesie montażu. Możesz zmieniać nazwy i opisy, a także dodawać własne statusy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {statuses.map((status, index) => (
            <div key={status.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
              <div className="mt-3 text-muted-foreground cursor-move">
                <GripVertical className="h-5 w-5" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="grid gap-2 flex-1">
                        <Label htmlFor={`label-${status.id}`}>Nazwa statusu</Label>
                        <Input
                            id={`label-${status.id}`}
                            value={status.label}
                            onChange={(e) => handleChange(index, 'label', e.target.value)}
                            placeholder="np. Oczekiwanie na materiał"
                        />
                    </div>
                    {status.isSystem && (
                        <Badge variant="secondary" className="mt-6">Systemowy</Badge>
                    )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`desc-${status.id}`}>Opis</Label>
                  <Textarea
                    id={`desc-${status.id}`}
                    value={status.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    placeholder="Krótki opis co oznacza ten status..."
                    rows={2}
                  />
                </div>
              </div>

              {!status.isSystem && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
            <Button variant="outline" onClick={handleAdd} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj status
            </Button>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
