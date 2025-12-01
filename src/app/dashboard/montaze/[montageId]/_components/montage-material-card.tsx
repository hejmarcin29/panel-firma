"use client";

import { Package, Edit2, Ruler, HelpCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      await updateMontageMaterialDetails({
        montageId: montage.id,
        materialDetails: formData.get("materialDetails") as string
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
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edytuj listę materiałów</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <Textarea
                name="materialDetails"
                className="min-h-[200px]"
                defaultValue={montage.materialDetails || ""}
                placeholder="Wpisz listę materiałów..."
              />
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {montage.materialDetails ? (
          <div className="whitespace-pre-wrap text-sm">
            {montage.materialDetails}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center text-sm text-muted-foreground">
            <Package className="mb-2 h-8 w-8 opacity-50" />
            <p>Brak listy materiałów</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Zapotrzebowanie wg pomiaru:</span>
            </div>
            
            {(!montage.floorArea && !montage.skirtingLength) ? (
                 <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-xs">Brak danych z pomiaru</span>
                 </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {montage.floorArea ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                            Podłoga: <span className="font-semibold ml-1">{montage.floorArea} m²</span>
                        </Badge>
                    ) : null}
                    {montage.skirtingLength ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                            Listwy: <span className="font-semibold ml-1">{montage.skirtingLength} mb</span>
                        </Badge>
                    ) : null}
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
