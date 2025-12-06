"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateKpiSettings } from "../actions";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { Loader2, Check } from "lucide-react";

interface KpiSettingsFormProps {
  initialMontageThreatDays: number;
  initialOrderUrgentDays: number;
}

export function KpiSettingsForm({ initialMontageThreatDays, initialOrderUrgentDays }: KpiSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [montageDays, setMontageDays] = useState(initialMontageThreatDays);
  const [orderDays, setOrderDays] = useState(initialOrderUrgentDays);

  const debouncedSave = useDebouncedCallback(async (mDays: number, oDays: number) => {
    setIsSaving(true);
    try {
      await updateKpiSettings(mDays, oDays);
      router.refresh();
    } catch (error) {
      toast.error("Nie udało się zapisać ustawień");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleMontageChange = (value: number) => {
    setMontageDays(value);
    debouncedSave(value, orderDays);
  };

  const handleOrderChange = (value: number) => {
    setOrderDays(value);
    debouncedSave(montageDays, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            Konfiguracja KPI / Alerty
            {isSaving ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Zapisywanie...
                </span>
            ) : (
                <span className="text-xs text-emerald-600 flex items-center gap-1 font-normal opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100" data-visible={!isSaving}>
                    <Check className="w-3 h-3" />
                    Zapisano
                </span>
            )}
        </CardTitle>
        <CardDescription>
          Dostosuj progi czasowe dla ostrzeżeń i statusów pilnych.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="montageDays">Zagrożone montaże (dni robocze)</Label>
            <Input
              id="montageDays"
              type="number"
              min="1"
              max="30"
              value={montageDays}
              onChange={(e) => handleMontageChange(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Ile dni przed terminem montaż ma zostać oznaczony jako zagrożony.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="orderDays">Pilne zamówienia (dni)</Label>
            <Input
              id="orderDays"
              type="number"
              min="1"
              max="30"
              value={orderDays}
              onChange={(e) => handleOrderChange(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Ile dni przed terminem zamówienie ma zostać oznaczone jako pilne.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
