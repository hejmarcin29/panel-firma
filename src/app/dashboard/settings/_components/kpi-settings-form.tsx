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
import { Separator } from "@/components/ui/separator";

interface KpiSettingsFormProps {
  initialMontageThreatDays: number;
  initialOrderUrgentDays: number;
  initialAlertMissingMaterialStatusDays: number;
  initialAlertMissingInstallerStatusDays: number;
  initialAlertMissingMeasurerDays: number;
  initialAlertMissingInstallerDays: number;
  initialAlertMaterialOrderedDays: number;
  initialAlertMaterialInstockDays: number;
  initialAlertLeadNoMeasurerDays: number;
  initialAlertQuoteDelayDays: number;
  initialAlertOfferStalledDays: number;
}

export function KpiSettingsForm({ 
    initialMontageThreatDays, 
    initialOrderUrgentDays,
    initialAlertMissingMaterialStatusDays,
    initialAlertMissingInstallerStatusDays,
    initialAlertMissingMeasurerDays,
    initialAlertMissingInstallerDays,
    initialAlertMaterialOrderedDays,
    initialAlertMaterialInstockDays,
    initialAlertLeadNoMeasurerDays,
    initialAlertQuoteDelayDays,
    initialAlertOfferStalledDays
}: KpiSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [montageDays, setMontageDays] = useState(initialMontageThreatDays);
  const [orderDays, setOrderDays] = useState(initialOrderUrgentDays);
  
  const [missingMaterialStatusDays, setMissingMaterialStatusDays] = useState(initialAlertMissingMaterialStatusDays);
  const [missingInstallerStatusDays, setMissingInstallerStatusDays] = useState(initialAlertMissingInstallerStatusDays);
  const [missingMeasurerDays, setMissingMeasurerDays] = useState(initialAlertMissingMeasurerDays);
  const [missingInstallerDays, setMissingInstallerDays] = useState(initialAlertMissingInstallerDays);
  const [materialOrderedDays, setMaterialOrderedDays] = useState(initialAlertMaterialOrderedDays);
  const [materialInstockDays, setMaterialInstockDays] = useState(initialAlertMaterialInstockDays);

  const [leadNoMeasurerDays, setLeadNoMeasurerDays] = useState(initialAlertLeadNoMeasurerDays);
  const [quoteDelayDays, setQuoteDelayDays] = useState(initialAlertQuoteDelayDays);
  const [offerStalledDays, setOfferStalledDays] = useState(initialAlertOfferStalledDays);

  const debouncedSave = useDebouncedCallback(async (
      mDays: number, 
      oDays: number,
      mMatStatDays: number,
      mInstStatDays: number,
      mMeasDays: number,
      mInstDays: number,
      matOrdDays: number,
      matStkDays: number,
      leadMeasDays: number,
      quoteDays: number,
      offerDays: number
    ) => {
    setIsSaving(true);
    try {
      await updateKpiSettings(
          mDays, 
          oDays,
          mMatStatDays,
          mInstStatDays,
          mMeasDays,
          mInstDays,
          matOrdDays,
          matStkDays,
          leadMeasDays,
          quoteDays,
          offerDays
        );
      router.refresh();
    } catch (error) {
      toast.error("Nie udało się zapisać ustawień");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  // Helper to trigger save with current state + one override
  const triggerSave = (overrides: Partial<{
      mDays: number, 
      oDays: number,
      mMatStatDays: number,
      mInstStatDays: number,
      mMeasDays: number,
      mInstDays: number,
      matOrdDays: number,
      matStkDays: number,
      leadMeasDays: number,
      quoteDays: number,
      offerDays: number
  }>) => {
      debouncedSave(
          overrides.mDays ?? montageDays,
          overrides.oDays ?? orderDays,
          overrides.mMatStatDays ?? missingMaterialStatusDays,
          overrides.mInstStatDays ?? missingInstallerStatusDays,
          overrides.mMeasDays ?? missingMeasurerDays,
          overrides.mInstDays ?? missingInstallerDays,
          overrides.matOrdDays ?? materialOrderedDays,
          overrides.matStkDays ?? materialInstockDays,
          overrides.leadMeasDays ?? leadNoMeasurerDays,
          overrides.quoteDays ?? quoteDelayDays,
          overrides.offerDays ?? offerStalledDays
      );
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
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="montageDays">Zagrożone montaże - ogólny (dni robocze)</Label>
            <Input
              id="montageDays"
              type="number"
              min="1"
              max="60"
              value={montageDays}
              onChange={(e) => {
                  const val = Number(e.target.value);
                  setMontageDays(val);
                  triggerSave({ mDays: val });
              }}
            />
            <p className="text-sm text-muted-foreground">
              Ile dni przed terminem montaż ma zostać oznaczony jako zagrożony (czerwona ramka na tablicy).
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="orderDays">Pilne zamówienia (dni)</Label>
            <Input
              id="orderDays"
              type="number"
              min="1"
              max="60"
              value={orderDays}
              onChange={(e) => {
                  const val = Number(e.target.value);
                  setOrderDays(val);
                  triggerSave({ oDays: val });
              }}
            />
            <p className="text-sm text-muted-foreground">
              Ile dni przed terminem zamówienie ma zostać oznaczone jako pilne.
            </p>
          </div>

          <Separator />
          <h3 className="font-semibold text-sm">Szczegółowe alerty (Dashboard)</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Określ, ile dni przed montażem ma pojawić się alert dla konkretnego braku.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
                <Label htmlFor="missingMaterialStatusDays">Brak statusu materiału</Label>
                <Input
                id="missingMaterialStatusDays"
                type="number"
                min="1"
                max="60"
                value={missingMaterialStatusDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setMissingMaterialStatusDays(val);
                    triggerSave({ mMatStatDays: val });
                }}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="missingInstallerStatusDays">Brak statusu montażu</Label>
                <Input
                id="missingInstallerStatusDays"
                type="number"
                min="1"
                max="60"
                value={missingInstallerStatusDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setMissingInstallerStatusDays(val);
                    triggerSave({ mInstStatDays: val });
                }}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="missingMeasurerDays">Brak pomiarowca</Label>
                <Input
                id="missingMeasurerDays"
                type="number"
                min="1"
                max="60"
                value={missingMeasurerDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setMissingMeasurerDays(val);
                    triggerSave({ mMeasDays: val });
                }}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="missingInstallerDays">Brak montażysty</Label>
                <Input
                id="missingInstallerDays"
                type="number"
                min="1"
                max="60"
                value={missingInstallerDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setMissingInstallerDays(val);
                    triggerSave({ mInstDays: val });
                }}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="materialOrderedDays">Materiał tylko "Zamówiony"</Label>
                <Input
                id="materialOrderedDays"
                type="number"
                min="1"
                max="60"
                value={materialOrderedDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaterialOrderedDays(val);
                    triggerSave({ matOrdDays: val });
                }}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="materialInstockDays">Materiał tylko "Na magazynie"</Label>
                <Input
                id="materialInstockDays"
                type="number"
                min="1"
                max="60"
                value={materialInstockDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaterialInstockDays(val);
                    triggerSave({ matStkDays: val });
                }}
                />
            </div>
          </div>

          <Separator />
          <h3 className="font-semibold text-sm">KPI - Pomiary i Oferty</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Alerty dla etapu sprzedażowego i technicznego.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
                <Label htmlFor="leadNoMeasurerDays">Brak pomiarowca (Lead)</Label>
                <Input
                id="leadNoMeasurerDays"
                type="number"
                min="1"
                max="60"
                value={leadNoMeasurerDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setLeadNoMeasurerDays(val);
                    triggerSave({ leadMeasDays: val });
                }}
                />
                <p className="text-[10px] text-muted-foreground">Dni od utworzenia klienta bez przypisanego pomiarowca.</p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="quoteDelayDays">Brak oferty po pomiarze</Label>
                <Input
                id="quoteDelayDays"
                type="number"
                min="1"
                max="60"
                value={quoteDelayDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setQuoteDelayDays(val);
                    triggerSave({ quoteDays: val });
                }}
                />
                <p className="text-[10px] text-muted-foreground">Dni od pomiaru bez wysłanej oferty.</p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="offerStalledDays">Brak reakcji na ofertę</Label>
                <Input
                id="offerStalledDays"
                type="number"
                min="1"
                max="60"
                value={offerStalledDays}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setOfferStalledDays(val);
                    triggerSave({ offerDays: val });
                }}
                />
                <p className="text-[10px] text-muted-foreground">Dni od wysłania oferty bez decyzji.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
