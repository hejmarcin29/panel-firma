"use client";

import { CheckCircle2, Circle, Upload, FileText, RefreshCw, Pencil, Trash2, Plus, X } from "lucide-react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
    toggleMontageChecklistItem, 
    uploadChecklistAttachment, 
    initializeMontageChecklist,
    addMontageChecklistItem,
    deleteMontageChecklistItem,
    updateMontageChecklistItemLabel,
    updateMontageStatus,
    updateMontageRealizationStatus
} from "../../actions";
import type { Montage, StatusOption } from "../../types";

export function MontageWorkflowTab({ montage, statusOptions }: { montage: Montage; statusOptions: StatusOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemAttachment, setNewItemAttachment] = useState(false);

  const handleToggle = (itemId: string, completed: boolean) => {
    if (isEditing) return;
    startTransition(async () => {
      await toggleMontageChecklistItem({ montageId: montage.id, itemId, completed });
      router.refresh();
    });
  };

  const handleFileUpload = async (itemId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('montageId', montage.id);
      formData.append('itemId', itemId);
      
      startTransition(async () => {
          await uploadChecklistAttachment(formData);
          router.refresh();
      });
  };

  const handleInitialize = () => {
    startTransition(async () => {
        await initializeMontageChecklist(montage.id);
        router.refresh();
    });
  };

  const handleAddItem = () => {
      if (!newItemLabel.trim()) return;
      startTransition(async () => {
          await addMontageChecklistItem({ 
              montageId: montage.id, 
              label: newItemLabel, 
              allowAttachment: newItemAttachment 
          });
          setNewItemLabel("");
          setNewItemAttachment(false);
          router.refresh();
      });
  };

  const handleDeleteItem = (itemId: string) => {
      if (!confirm("Czy na pewno chcesz usunąć ten etap?")) return;
      startTransition(async () => {
          await deleteMontageChecklistItem({ montageId: montage.id, itemId });
          router.refresh();
      });
  };

  const handleUpdateLabel = (itemId: string, newLabel: string) => {
      startTransition(async () => {
          await updateMontageChecklistItemLabel({ montageId: montage.id, itemId, label: newLabel });
          router.refresh();
      });
  };

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
        await updateMontageStatus({ montageId: montage.id, status });
        router.refresh();
    });
  };

  const handleRealizationStatusChange = (field: 'isMaterialOrdered' | 'isInstallerConfirmed', value: boolean) => {
    startTransition(async () => {
        await updateMontageRealizationStatus({ 
            montageId: montage.id, 
            [field]: value 
        });
        router.refresh();
    });
  };

  const currentStatusIndex = statusOptions.findIndex(o => o.value === montage.status);

  return (
    <div className="space-y-8">
        <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Status Realizacji</h3>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    montage.isMaterialOrdered ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" : "bg-card"
                )}>
                    <div className="space-y-0.5">
                        <Label htmlFor="material-ordered" className="text-base font-medium">Zamówiono materiał</Label>
                        <p className="text-sm text-muted-foreground">Potwierdzenie zamówienia u dostawcy</p>
                    </div>
                    <Switch 
                        id="material-ordered"
                        checked={montage.isMaterialOrdered}
                        onCheckedChange={(checked) => handleRealizationStatusChange('isMaterialOrdered', checked)}
                    />
                </div>

                <div className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    montage.isInstallerConfirmed ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" : "bg-card"
                )}>
                    <div className="space-y-0.5">
                        <Label htmlFor="installer-confirmed" className="text-base font-medium">Potwierdzony montażysta</Label>
                        <p className="text-sm text-muted-foreground">Termin i wykonawca ustalony</p>
                    </div>
                    <Switch 
                        id="installer-confirmed"
                        checked={montage.isInstallerConfirmed}
                        onCheckedChange={(checked) => handleRealizationStatusChange('isInstallerConfirmed', checked)}
                    />
                </div>
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Etapy montażu</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {statusOptions.map((option, index) => {
                    const isCurrent = montage.status === option.value;
                    const isPast = currentStatusIndex > index;
                    
                    return (
                        <div 
                            key={option.value} 
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                                isCurrent ? "bg-primary/5 border-primary ring-1 ring-primary" : "hover:bg-muted/50",
                                isPast ? "bg-muted/30" : ""
                            )}
                            onClick={() => handleStatusChange(option.value)}
                        >
                            <div className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors mt-0.5",
                                isCurrent ? "border-primary bg-primary text-primary-foreground" : 
                                isPast ? "border-primary/40 text-primary/40 bg-primary/5" : "border-muted-foreground text-muted-foreground"
                            )}>
                                {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                            </div>
                            <div>
                                <div className={cn("font-medium text-sm", isCurrent && "text-primary")}>{option.label}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">{option.description}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>

        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Lista kontrolna</h3>
                    <p className="text-sm text-muted-foreground">Zadania do wykonania w ramach realizacji.</p>
                </div>
                {montage.checklistItems.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <X className="h-4 w-4 mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                        {isEditing ? "Zakończ edycję" : "Edytuj listę"}
                    </Button>
                )}
            </div>

            {montage.checklistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Brak etapów przebiegu</h3>
                    <p className="mb-6 text-sm text-muted-foreground max-w-sm">
                        Ten montaż nie ma jeszcze zdefiniowanych etapów realizacji. Możesz wygenerować domyślną listę kontrolną.
                    </p>
                    <Button onClick={handleInitialize} disabled={pending}>
                        {pending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Wygeneruj przebieg
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {montage.checklistItems.map((item) => (
                        <div key={item.id} className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                            {isEditing ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive/90"
                                    onClick={() => handleDeleteItem(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Checkbox
                                    id={item.id}
                                    checked={item.completed}
                                    onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                                    className="mt-1"
                                />
                            )}
                            
                            <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    {isEditing ? (
                                        <Input
                                            defaultValue={item.label}
                                            className="h-8"
                                            onBlur={(e) => {
                                                if (e.target.value !== item.label) {
                                                    handleUpdateLabel(item.id, e.target.value);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <Label
                                            htmlFor={item.id}
                                            className={cn(
                                                "text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                                                item.completed && "text-muted-foreground line-through"
                                            )}
                                        >
                                            {item.label}
                                        </Label>
                                    )}
                                </div>

                                {item.allowAttachment && (
                                    <div className="flex items-center gap-2">
                                        {item.attachment ? (
                                            <a
                                                href={item.attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs font-medium text-primary hover:underline"
                                            >
                                                <FileText className="h-3 w-3" />
                                                {item.attachment.title || "Załącznik"}
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="file"
                                                    id={`file-${item.id}`}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(item.id, file);
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                                                    disabled={pending}
                                                >
                                                    <Upload className="mr-2 h-3 w-3" />
                                                    Dodaj załącznik
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isEditing && (
                        <div className="flex items-center gap-2 pt-2">
                            <Input
                                placeholder="Nowy etap..."
                                value={newItemLabel}
                                onChange={(e) => setNewItemLabel(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                            />
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="new-attachment"
                                    checked={newItemAttachment}
                                    onCheckedChange={(c) => setNewItemAttachment(c as boolean)}
                                />
                                <Label htmlFor="new-attachment" className="text-xs whitespace-nowrap">
                                    Wymagany załącznik
                                </Label>
                            </div>
                            <Button size="sm" onClick={handleAddItem}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    </div>
  );
}
