"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateKpiSettings } from "../actions";
import { toast } from "sonner";

interface KpiSettingsFormProps {
  initialMontageThreatDays: number;
  initialOrderUrgentDays: number;
}

export function KpiSettingsForm({ initialMontageThreatDays, initialOrderUrgentDays }: KpiSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [montageDays, setMontageDays] = useState(initialMontageThreatDays);
  const [orderDays, setOrderDays] = useState(initialOrderUrgentDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        await updateKpiSettings(montageDays, orderDays);
        toast.success("Ustawienia KPI zostały zaktualizowane");
        router.refresh();
      } catch (error) {
        toast.error("Nie udało się zapisać ustawień");
        console.error(error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konfiguracja KPI / Alerty</CardTitle>
        <CardDescription>
          Dostosuj progi czasowe dla ostrzeżeń i statusów pilnych.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="montageDays">Zagrożone montaże (dni robocze)</Label>
            <Input
              id="montageDays"
              type="number"
              min="1"
              max="30"
              value={montageDays}
              onChange={(e) => setMontageDays(Number(e.target.value))}
              disabled={isPending}
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
              onChange={(e) => setOrderDays(Number(e.target.value))}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              Ile dni przed terminem zamówienie ma zostać oznaczone jako pilne.
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
