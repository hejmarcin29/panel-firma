"use client";

import { CheckCircle2, Circle, Upload, FileText, RefreshCw, Pencil, Trash2, Plus, X } from "lucide-react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
    toggleMontageChecklistItem, 
    uploadChecklistAttachment, 
    initializeMontageChecklist,
    addMontageChecklistItem,
    deleteMontageChecklistItem,
    updateMontageChecklistItemLabel
} from "../../actions";
import type { Montage } from "../../types";

export function MontageWorkflowTab({ montage }: { montage: Montage }) {
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

  if (montage.checklistItems.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
      );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-end">
        <Button 
            variant={isEditing ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            disabled={pending}
        >
            {isEditing ? (
                <>
                    <X className="mr-2 h-4 w-4" />
                    Zakończ edycję
                </>
            ) : (
                <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj listę
                </>
            )}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border md:left-8" />
        <div className="space-y-8">
          {montage.checklistItems.map((item) => (
            <div key={item.id} className="relative flex gap-4 md:gap-8">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border md:h-16 md:w-16">
                {isEditing ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={pending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <button
                        onClick={() => handleToggle(item.id, !item.completed)}
                        disabled={pending}
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full transition-colors md:h-10 md:w-10",
                            item.completed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {item.completed ? <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6" /> : <Circle className="h-4 w-4 md:h-6 md:w-6" />}
                    </button>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 pt-1 md:pt-4">
                <div className="flex items-center justify-between gap-2">
                    {isEditing ? (
                        <Input 
                            defaultValue={item.label}
                            onBlur={(e) => {
                                if (e.target.value !== item.label) {
                                    handleUpdateLabel(item.id, e.target.value);
                                }
                            }}
                            className="h-8 font-semibold md:text-lg"
                        />
                    ) : (
                        <h3 className={cn("font-semibold md:text-lg", item.completed && "text-muted-foreground line-through")}>
                            {item.label}
                        </h3>
                    )}
                    
                    {!isEditing && item.updatedAt && item.completed && (
                        <span className="text-xs text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
                
                {!isEditing && item.allowAttachment && (
                    <div className="mt-2">
                        {item.attachment ? (
                            <Card className="inline-flex items-center gap-2 p-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <a href={item.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                                    {item.attachment.title || "Załącznik"}
                                </a>
                            </Card>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id={`file-${item.id}`}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(item.id, file);
                                    }}
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <label htmlFor={`file-${item.id}`} className="cursor-pointer">
                                        <Upload className="mr-2 h-3 w-3" />
                                        Dodaj dokument
                                    </label>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          ))}

          {isEditing && (
              <div className="relative flex gap-4 md:gap-8 pt-4 border-t">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border md:h-16 md:w-16">
                      <Plus className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 pt-1 md:pt-4">
                      <div className="grid gap-4">
                          <div className="grid gap-2">
                              <Label htmlFor="new-item-label">Nowy etap</Label>
                              <Input 
                                  id="new-item-label"
                                  placeholder="Nazwa nowego etapu..."
                                  value={newItemLabel}
                                  onChange={(e) => setNewItemLabel(e.target.value)}
                              />
                          </div>
                          <div className="flex items-center space-x-2">
                              <Checkbox 
                                  id="new-item-attachment" 
                                  checked={newItemAttachment}
                                  onCheckedChange={(c) => setNewItemAttachment(!!c)}
                              />
                              <Label htmlFor="new-item-attachment">Wymagaj załącznika</Label>
                          </div>
                          <Button onClick={handleAddItem} disabled={!newItemLabel.trim() || pending} className="w-fit">
                              <Plus className="mr-2 h-4 w-4" />
                              Dodaj etap
                          </Button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
