"use client";

import { CheckCircle2, Circle, Upload, FileText, RefreshCw, Pencil, Trash2, Plus, X, AlertTriangle, Lock } from "lucide-react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MontageProcessTimeline } from "./montage-process-timeline";
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
import { type MontageDetailsData } from "../actions";
import type { Montage, StatusOption } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MontageProcessTimeline } from "./montage-process-timeline";

type UserOption = { id: string; name: string | null; email: string };

const LOCKED_TEMPLATE_IDS = [
    'contract_signed_check',
    'advance_invoice_issued',
    'advance_invoice_paid',
    'protocol_signed',
    'final_invoice_issued',
    'final_invoice_paid'
];

export function MontageWorkflowTab({ 
    montage, 
    statusOptions,
    installers = [],
    measurers = [],
    userRoles = []
}: { 
    montage: Montage; 
    statusOptions: StatusOption[];
    installers?: UserOption[];
    measurers?: UserOption[];
    userRoles?: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemAttachment, setNewItemAttachment] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const isInstaller = userRoles.includes('installer') && !userRoles.includes('admin');

  const { mutate: mutateStatus } = useMutation({
    mutationKey: ['updateMontageStatus', montage.id],
    mutationFn: async (status: string) => {
        return await updateMontageStatus({ montageId: montage.id, status });
    },
    onMutate: async (newStatus) => {
        await queryClient.cancelQueries({ queryKey: ['montage', montage.id] });
        const previousData = queryClient.getQueryData(['montage', montage.id]);
        queryClient.setQueryData(['montage', montage.id], (old: MontageDetailsData | undefined) => {
            if (!old) return old;
            return {
                ...old,
                montage: { ...old.montage, status: newStatus }
            };
        });
        return { previousData };
    },
    onError: (err, newStatus, context) => {
        queryClient.setQueryData(['montage', montage.id], context?.previousData);
        toast.error("Błąd aktualizacji statusu");
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['montage', montage.id] });
        router.refresh();
    }
  });

  const { mutate: mutateChecklist } = useMutation({
    mutationKey: ['toggleChecklist', montage.id],
    mutationFn: async ({ itemId, completed }: { itemId: string, completed: boolean }) => {
        return await toggleMontageChecklistItem({ montageId: montage.id, itemId, completed });
    },
    onMutate: async ({ itemId, completed }) => {
        await queryClient.cancelQueries({ queryKey: ['montage', montage.id] });
        const previousData = queryClient.getQueryData(['montage', montage.id]);
        queryClient.setQueryData(['montage', montage.id], (old: MontageDetailsData | undefined) => {
            if (!old) return old;
            return {
                ...old,
                montage: {
                    ...old.montage,
                    checklistItems: old.montage.checklistItems.map((item) => 
                        item.id === itemId ? { ...item, completed } : item
                    )
                }
            };
        });
        return { previousData };
    },
    onError: (err, vars, context) => {
        queryClient.setQueryData(['montage', montage.id], context?.previousData);
        toast.error("Błąd aktualizacji checklisty");
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['montage', montage.id] });
        router.refresh();
    }
  });

  const handleToggle = (itemId: string, completed: boolean) => {
    if (isEditing) return;
    mutateChecklist({ itemId, completed });
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
    // Hard Validation Logic
    const targetStatusIndex = statusOptions.findIndex(s => s.value === status);
    const currentStatusIndex = statusOptions.findIndex(s => s.value === montage.status);

    if (targetStatusIndex > currentStatusIndex) {
        // Check if all checklist items for CURRENT and PREVIOUS stages are completed
        for (let i = currentStatusIndex; i < targetStatusIndex; i++) {
            const stageId = statusOptions[i].value;
            
            // Find items for this stage
            const stageItems = montage.checklistItems.filter(item => {
                const template = DEFAULT_MONTAGE_CHECKLIST.find(t => t.id === item.templateId);
                return template?.associatedStage === stageId;
            });
            
            const incompleteItems = stageItems.filter(item => !item.completed);
            
            if (incompleteItems.length > 0) {
                const missingLabels = incompleteItems.map(i => i.label).join(", ");
                const message = isInstaller 
                    ? `Nie można zmienić etapu. Biuro musi zatwierdzić etap: ${statusOptions[i].label}`
                    : `Nie można zmienić etapu. Dokończ zadania z etapu: ${statusOptions[i].label} (Brakuje: ${missingLabels})`;
                setAlertMessage(message);
                setAlertOpen(true);
                return;
            }
        }
    }

    mutateStatus(status);
  };

  const handleRealizationStatusChange = (field: 'materialStatus' | 'installerStatus' | 'installerId' | 'measurerId', value: string) => {
    startTransition(async () => {
        const updateData: { 
            montageId: string; 
            materialStatus?: 'none' | 'ordered' | 'in_stock' | 'delivered'; 
            installerStatus?: 'none' | 'informed' | 'confirmed';
            installerId?: string | null;
            measurerId?: string | null;
        } = {
            montageId: montage.id
        };
        
        if (field === 'materialStatus') {
            updateData.materialStatus = value as 'none' | 'ordered' | 'in_stock' | 'delivered';
        } else if (field === 'installerStatus') {
            updateData.installerStatus = value as 'none' | 'informed' | 'confirmed';
        } else if (field === 'installerId') {
            const newInstallerId = value === 'none' ? null : value;
            updateData.installerId = newInstallerId;
            // Logic: If installer assigned -> default to 'informed'. If removed -> 'none'.
            updateData.installerStatus = newInstallerId ? 'informed' : 'none';
        } else if (field === 'measurerId') {
            updateData.measurerId = value === 'none' ? null : value;
        }

        await updateMontageRealizationStatus(updateData);
        router.refresh();
    });
  };

  const currentStatusIndex = statusOptions.findIndex(o => o.value === montage.status);

  // KPI Logic
  const daysToInstallation = montage.scheduledInstallationAt 
    ? differenceInCalendarDays(new Date(montage.scheduledInstallationAt), new Date()) 
    : null;

  const renderChecklistItem = (item: typeof montage.checklistItems[0]) => {
      const isLocked = item.templateId && LOCKED_TEMPLATE_IDS.includes(item.templateId);
      
      return (
        <div key={item.id} className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
            {isEditing ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6", isLocked ? "text-muted-foreground cursor-not-allowed" : "text-destructive hover:text-destructive/90")}
                    onClick={() => !isLocked && handleDeleteItem(item.id)}
                    disabled={!!isLocked}
                    title={isLocked ? "Ten element jest wymagany przez system" : "Usuń element"}
                >
                    {isLocked ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
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
                            disabled={!!isLocked}
                            title={isLocked ? "Nazwa tego elementu jest zablokowana" : undefined}
                            onBlur={(e) => {
                                if (!isLocked && e.target.value !== item.label) {
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
      );
  };

  const getMaterialAlert = () => {
    if (daysToInstallation === null) return null;
    
    const status = montage.materialStatus;
    
    // 10 days before: Must be at least 'ordered'
    if (daysToInstallation <= 10 && status === 'none') {
        return { level: 'warning', message: 'Materiał powinien być już zamówiony (10 dni przed montażem)' };
    }
    
    // 5 days before: Must be at least 'in_stock'
    if (daysToInstallation <= 5 && (status === 'none' || status === 'ordered')) {
        return { level: 'error', message: 'Materiał powinien być na magazynie (5 dni przed montażem)' };
    }
    
    // 2 days before: Must be at least 'delivered'
    if (daysToInstallation <= 2 && (status === 'none' || status === 'ordered' || status === 'in_stock')) {
        return { level: 'critical', message: 'Materiał powinien być dostarczony (2 dni przed montażem)' };
    }
    
    return null;
  };

  const materialAlert = getMaterialAlert();

  return (
    <Tabs defaultValue="simple" className="w-full space-y-6">
        <div className="flex items-center justify-between">
             <TabsList>
                <TabsTrigger value="simple">Lista Zadań</TabsTrigger>
                <TabsTrigger value="timeline">Oś Czasu (Process Hub)</TabsTrigger>
             </TabsList>
        </div>

        <TabsContent value="timeline">
             <MontageProcessTimeline montage={montage} />
        </TabsContent>

        <TabsContent value="simple" className="space-y-8">
        <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Status Realizacji</h3>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className={cn(
                    "flex flex-col gap-2 p-4 rounded-lg border transition-colors",
                    montage.materialStatus === 'none' ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900" :
                    montage.materialStatus === 'ordered' ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900" :
                    (montage.materialStatus === 'in_stock' || montage.materialStatus === 'delivered') ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" : "bg-card"
                )}>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="material-status" className="text-base font-medium">Status Materiału</Label>
                                {materialAlert && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertTriangle className={cn(
                                                    "h-4 w-4",
                                                    materialAlert.level === 'critical' ? "text-red-500" :
                                                    materialAlert.level === 'error' ? "text-orange-500" :
                                                    "text-yellow-500"
                                                )} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{materialAlert.message}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Status zamówienia materiałów</p>
                        </div>
                    </div>
                    <Select 
                        value={montage.materialStatus} 
                        onValueChange={(value) => handleRealizationStatusChange('materialStatus', value)}
                    >
                        <SelectTrigger id="material-status">
                            <SelectValue placeholder="Wybierz status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak</SelectItem>
                            <SelectItem value="ordered">Zamówiono</SelectItem>
                            <SelectItem value="in_stock">Na magazynie</SelectItem>
                            <SelectItem value="delivered">Dostarczono</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className={cn(
                    "flex flex-col gap-2 p-4 rounded-lg border transition-colors",
                    montage.installerStatus === 'none' ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900" :
                    montage.installerStatus === 'informed' ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900" :
                    montage.installerStatus === 'confirmed' ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" : "bg-card"
                )}>
                    <div className="space-y-0.5">
                        <Label htmlFor="installer-status" className="text-base font-medium">Montażysta potwierdził</Label>
                        <p className="text-sm text-muted-foreground">Czy montażysta potwierdził termin?</p>
                    </div>
                    <Select 
                        value={montage.installerStatus} 
                        onValueChange={(value) => handleRealizationStatusChange('installerStatus', value)}
                    >
                        <SelectTrigger id="installer-status">
                            <SelectValue placeholder="Wybierz status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nie</SelectItem>
                            <SelectItem value="confirmed">Tak</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className={cn(
                    "flex flex-col gap-2 p-4 rounded-lg border transition-colors",
                    !montage.measurerId ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900" :
                    "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
                )}>
                    <div className="space-y-0.5">
                        <Label htmlFor="measurer-select" className="text-base font-medium">Przypisz Pomiarowca</Label>
                        <p className="text-sm text-muted-foreground">Osoba odpowiedzialna za pomiar</p>
                    </div>
                    <Select 
                        value={montage.measurerId || "none"} 
                        onValueChange={(value) => handleRealizationStatusChange('measurerId', value)}
                    >
                        <SelectTrigger id="measurer-select">
                            <SelectValue placeholder="Wybierz pomiarowca" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak</SelectItem>
                            {measurers.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className={cn(
                    "flex flex-col gap-2 p-4 rounded-lg border transition-colors",
                    !montage.installerId ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900" :
                    "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
                )}>
                    <div className="space-y-0.5">
                        <Label htmlFor="installer-select" className="text-base font-medium">Przypisz Montażystę</Label>
                        <p className="text-sm text-muted-foreground">Osoba odpowiedzialna za montaż</p>
                    </div>
                    <Select 
                        value={montage.installerId || "none"} 
                        onValueChange={(value) => handleRealizationStatusChange('installerId', value)}
                    >
                        <SelectTrigger id="installer-select">
                            <SelectValue placeholder="Wybierz montażystę" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak</SelectItem>
                            {installers.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

        {!isInstaller && (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Checkboxy Dokumenty</h3>
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
                <div className="space-y-6">
                    {statusOptions.map(status => {
                        const stageItems = montage.checklistItems.filter(item => {
                            const template = DEFAULT_MONTAGE_CHECKLIST.find(t => t.id === item.templateId);
                            return template?.associatedStage === status.value;
                        });

                        if (stageItems.length === 0) return null;

                        return (
                            <div key={status.value} className="space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        {status.label}
                                    </h4>
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                                        {stageItems.filter(i => i.completed).length}/{stageItems.length}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {stageItems.map(renderChecklistItem)}
                                </div>
                            </div>
                        );
                    })}

                    {/* Other Items */}
                    {(() => {
                        const otherItems = montage.checklistItems.filter(item => {
                            const template = DEFAULT_MONTAGE_CHECKLIST.find(t => t.id === item.templateId);
                            return !template?.associatedStage;
                        });

                        if (otherItems.length === 0) return null;

                        return (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Inne / Niestandardowe
                                    </h4>
                                </div>
                                <div className="space-y-2">
                                    {otherItems.map(renderChecklistItem)}
                                </div>
                            </div>
                        );
                    })()}

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
        )}

        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Wymagane działania</AlertDialogTitle>
                    <AlertDialogDescription>
                        {alertMessage}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setAlertOpen(false)}>Rozumiem</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </TabsContent>
    </Tabs>
  );
}
