"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloorCalculatorProps {
  pricePerM2: number;
  packageSizeM2: number;
  unit: string;
}

export function FloorCalculator({ pricePerM2, packageSizeM2, unit }: FloorCalculatorProps) {
  const [area, setArea] = useState<string>("20");
  const [waste, setWaste] = useState<string>("5"); // 5% waste

  const areaNum = parseFloat(area) || 0;
  const wasteNum = parseFloat(waste) || 0;

  // Logic for calculations
  const areaWithWaste = areaNum * (1 + wasteNum / 100);
  
  // If unit is 'm2' and we sell by packages
  const packsNeeded = Math.ceil(areaWithWaste / packageSizeM2);
  const totalArea = packsNeeded * packageSizeM2;
  const totalPrice = totalArea * pricePerM2;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-primary" />
          Kalkulator Potrzeb
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Powierzchnia (m²)</label>
            <Input 
              type="number" 
              value={area} 
              onChange={(e) => setArea(e.target.value)}
              min="1"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Zapas na docinki (%)</label>
            <div className="flex gap-2">
               {[5, 10].map((val) => (
                 <button
                   key={val}
                   onClick={() => setWaste(val.toString())}
                   className={cn(
                     "flex-1 rounded-md border py-2 text-sm font-medium transition-colors",
                     waste === val.toString() 
                       ? "bg-primary text-primary-foreground border-primary" 
                       : "bg-background hover:bg-muted"
                   )}
                 >
                   {val}%
                 </button>
               ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Potrzebujesz:</span>
            <span className="font-medium">{areaWithWaste.toFixed(2)} m²</span>
          </div>
          <div className="flex justify-between text-sm items-center">
             <span>Ilość paczek:</span>
             <span className="font-bold text-lg">{packsNeeded} op.</span>
          </div>
           <div className="flex justify-between text-sm text-muted-foreground border-t pt-2 mt-2">
             <span>Razem do zamówienia:</span>
             <span>{totalArea.toFixed(3)} m²</span>
          </div>
        </div>

        <div className="pt-2">
            <div className="flex items-end justify-between mb-4">
                <span className="text-muted-foreground text-sm">Cena całkowita:</span>
                <span className="text-3xl font-bold tracking-tight text-primary">
                    {totalPrice.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                </span>
            </div>
            <Button size="lg" className="w-full h-12 text-base font-semibold">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Dodaj do koszyka
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
                Darmowa dostawa od 4000 zł
            </p>
        </div>
      </div>
    </div>
  );
}
