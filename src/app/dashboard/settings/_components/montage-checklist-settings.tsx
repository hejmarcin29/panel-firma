'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { updateMontageChecklistTemplatesAction } from '../actions';

type TemplateItem = {
  id: string;
  label: string;
  allowAttachment: boolean;
};

interface MontageChecklistSettingsProps {
  initialTemplates: TemplateItem[];
}

export function MontageChecklistSettings({ initialTemplates }: MontageChecklistSettingsProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setTemplates([
      ...templates,
      {
        id: crypto.randomUUID(),
        label: '',
        allowAttachment: false,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const next = [...templates];
    next.splice(index, 1);
    setTemplates(next);
  };

  const handleChange = (index: number, field: keyof TemplateItem, value: string | boolean) => {
    const next = [...templates];
    // @ts-expect-error - dynamic assignment
    next[index] = { ...next[index], [field]: value };
    setTemplates(next);
  };

  const handleSave = () => {
    // Validate
    if (templates.some(t => !t.label.trim())) {
      toast.error("Wszystkie etapy muszą mieć nazwę.");
      return;
    }
    if (templates.length === 0) {
      toast.error("Lista etapów nie może być pusta.");
      return;
    }

    startTransition(async () => {
      try {
        await updateMontageChecklistTemplatesAction(templates);
        toast.success("Zapisano szablony etapów.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szablony etapów montażu</CardTitle>
        <CardDescription>
          Zdefiniuj domyślne etapy, które będą pojawiać się w nowych montażach.
          Zmiana tutaj nie wpłynie na już istniejące montaże.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {templates.map((item, index) => (
            <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
              <div className="mt-3 text-muted-foreground cursor-move">
                <GripVertical className="h-5 w-5" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor={`label-${item.id}`}>Nazwa etapu</Label>
                  <Input
                    id={`label-${item.id}`}
                    value={item.label}
                    onChange={(e) => handleChange(index, 'label', e.target.value)}
                    placeholder="np. Wystawiono FV zaliczkową"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`attachment-${item.id}`}
                    checked={item.allowAttachment}
                    onCheckedChange={(checked) => handleChange(index, 'allowAttachment', checked)}
                  />
                  <Label htmlFor={`attachment-${item.id}`} className="font-normal cursor-pointer">
                    Wymagaj/Pozwól na załącznik (np. skan protokołu)
                  </Label>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleAdd} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj etap
          </Button>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
                <>Zapisywanie...</>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Zapisz zmiany
                </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
