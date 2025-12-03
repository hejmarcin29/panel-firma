"use client";

import { Package, Edit2, Ruler, HelpCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { updateMontageMaterialDetails } from "../../actions";
import type { Montage } from "../../types";

export function MontageMaterialCard({ montage }: { montage: Montage }) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const calculatedPanelAmount = montage.floorArea 
    ? (montage.floorArea * (1 + (montage.panelWaste || 5) / 100)).toFixed(2) 
    : null;
  const calculatedSkirtingLength = montage.skirtingLength 
    ? (montage.skirtingLength * (1 + (montage.skirtingWaste || 5) / 100)).toFixed(2) 
    : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const finalPanelAmountStr = formData.get("finalPanelAmount") as string;
    const finalSkirtingLengthStr = formData.get("finalSkirtingLength") as string;

    startTransition(async () => {
      await updateMontageMaterialDetails({
        montageId: montage.id,
        materialDetails: formData.get("materialDetails") as string,
        finalPanelAmount: finalPanelAmountStr ? parseFloat(finalPanelAmountStr) : null,
        finalSkirtingLength: finalSkirtingLengthStr ? parseFloat(finalSkirtingLengthStr) : null,
      });
      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Materiały</CardTitle>
        <Sheet open={isEditing} onOpenChange={setIsEditing}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Edytuj listę materiałów</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Ilość paneli do zamówienia (m²)</Label>
                <div className="flex gap-2 items-center">
                    <Input 
                        name="finalPanelAmount" 
                        type="number" 
                        step="0.01" 
                        defaultValue={montage.finalPanelAmount || calculatedPanelAmount || ""} 
                        className="w-32"
                    />
                    <div className="text-xs text-muted-foreground">
                        (Wyliczono z pomiaru: {calculatedPanelAmount || 0} m²)
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ilość listew do zamówienia (mb)</Label>
                <div className="flex gap-2 items-center">
                    <Input 
                        name="finalSkirtingLength" 
                        type="number" 
                        step="0.01" 
                        defaultValue={montage.finalSkirtingLength || calculatedSkirtingLength || ""} 
                        className="w-32"
                    />
                    <div className="text-xs text-muted-foreground">
                        (Wyliczono z pomiaru: {calculatedSkirtingLength || 0} mb)
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dodatkowe materiały / uwagi</Label>
                <Textarea
                    name="materialDetails"
                    className="min-h-[150px]"
                    defaultValue={montage.materialDetails || ""}
                    placeholder="Wpisz listę materiałów..."
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </form>
            
            {montage.materialsEditHistory && Array.isArray(montage.materialsEditHistory) && montage.materialsEditHistory.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Historia edycji</h4>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto text-xs text-muted-foreground">
                        {[...montage.materialsEditHistory].reverse().map((entry: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1 pb-2 border-b border-border/50 last:border-0">
                                <span className="font-medium">{new Date(entry.date).toLocaleString('pl-PL')}</span>
                                <div className="pl-2 border-l-2 border-muted">
                                    {entry.changes.finalPanelAmount && <div>Panele: {entry.changes.finalPanelAmount} m²</div>}
                                    {entry.changes.finalSkirtingLength && <div>Listwy: {entry.changes.finalSkirtingLength} mb</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Panele (do zamówienia)</span>
                <div className="font-medium">
                    {montage.finalPanelAmount ? `${montage.finalPanelAmount} m²` : (calculatedPanelAmount ? `${calculatedPanelAmount} m² (auto)` : '-')}
                </div>
                {montage.panelModel && <div className="text-xs text-muted-foreground">{montage.panelModel}</div>}
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Listwy (do zamówienia)</span>
                <div className="font-medium">
                    {montage.finalSkirtingLength ? `${montage.finalSkirtingLength} mb` : (calculatedSkirtingLength ? `${calculatedSkirtingLength} mb (auto)` : '-')}
                </div>
                {montage.skirtingModel && <div className="text-xs text-muted-foreground">{montage.skirtingModel}</div>}
            </div>
        </div>

        {montage.materialDetails && (
          <div className="pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground block mb-2">Dodatkowe uwagi:</span>
            <div className="whitespace-pre-wrap text-sm bg-muted/30 p-3 rounded-md">
                {montage.materialDetails}
            </div>
          </div>
        )}

        {!montage.finalPanelAmount && !montage.finalSkirtingLength && !montage.materialDetails && !calculatedPanelAmount && (
          <div className="flex flex-col items-center justify-center py-4 text-center text-sm text-muted-foreground">
            <Package className="mb-2 h-8 w-8 opacity-50" />
            <p>Brak danych materiałowych</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
