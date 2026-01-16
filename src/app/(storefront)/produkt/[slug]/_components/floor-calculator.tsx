"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, RefreshCcw, Check, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import { calculateMontageEstimation } from "@/server/actions/calculator-actions";
import { AuditDrawer } from "@/components/storefront/audit-drawer";

interface FloorCalculatorProps {
  product: {
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
  };
  pricePerM2: number;
  packageSizeM2: number;
  unit: string;
  isSampleAvailable?: boolean;
  isPurchasable?: boolean;
  samplePrice?: number;
  mountingMethod?: string | null;
  floorPattern?: string | null;
  floorPatternSlug?: string | null;
  wasteRates?: Record<string, { simple: number; complex: number }>;
}

export function FloorCalculator({ 
    product, 
    pricePerM2, 
    packageSizeM2, 
    unit,
    // samplePrice, // Removed unused
    mountingMethod,
    floorPattern,
    floorPatternSlug,
    wasteRates
}: FloorCalculatorProps) {
  // Determine waste rates based on pattern
  const defaultRates = wasteRates?.['default'] || { simple: 5, complex: 10 };
  const currentRates = (floorPatternSlug && wasteRates?.[floorPatternSlug]) 
        ? wasteRates[floorPatternSlug] 
        : defaultRates;

  const [mode, setMode] = useState<"material" | "montage">("material");
  const [area, setArea] = useState<string>("20");
  const [waste, setWaste] = useState<string>(currentRates.simple.toString()); 
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Estimation State
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [estimation, setEstimation] = useState<{
    totalGross8: number;
    vatSavings: number;
    priceRange: { min: number; max: number };
  } | null>(null);

  // Sticky Bar Logic
  const actionsRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky when actions are NOT visible and we've scrolled past them (top < 0)
        // Adjust threshold if needed.
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    if (actionsRef.current) {
      observer.observe(actionsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const { addItem } = useCartStore();

  const areaNum = parseFloat(area) || 0;
  const wasteNum = parseFloat(waste) || 0;

  // Logic for calculations
  const areaWithWaste = areaNum * (1 + wasteNum / 100);
  
  const isFlooring = unit === 'm2';
  
  const packsNeeded = isFlooring && packageSizeM2 > 0
    ? Math.ceil(areaWithWaste / packageSizeM2)
    : Math.ceil(areaWithWaste); 

  const totalArea = isFlooring && packageSizeM2 > 0
    ? packsNeeded * packageSizeM2
    : packsNeeded;

  const totalPrice = totalArea * pricePerM2;

  // Effect: Calculate Montage Estimation when params change
  useEffect(() => {
    if (mode === 'montage' && areaNum > 0) {
        // Assume pricePerM2 is Gross 23%
        calculateMontageEstimation(areaNum, mountingMethod || '', floorPattern || '', pricePerM2)
            .then(res => setEstimation(res))
            .catch(err => console.error(err));
    }
  }, [mode, areaNum, mountingMethod, floorPattern, pricePerM2]);


  const handleAddToCart = () => {
    if (totalPrice <= 0) return;

    if (addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.imageUrl,
      pricePerUnit: isFlooring ? (pricePerM2 * packageSizeM2) : pricePerM2,
      vatRate: 0.23,
      quantity: packsNeeded,
      unit: unit,
      packageSize: packageSizeM2
    })) {
        toast.success("Dodano do koszyka");
    }
  };



  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/60 p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-primary" />
          Kalkulator Błyskawiczny
        </h3>
      </div>

      {isFlooring && (
         <div className="bg-muted p-1 rounded-lg grid grid-cols-2 gap-1 mb-4">
            <button
                onClick={() => setMode("material")}
                className={cn(
                    "text-sm font-medium py-1.5 px-3 rounded-md transition-all",
                    mode === "material" 
                        ? "bg-white text-primary shadow-sm ring-1 ring-border" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
            >
                Tylko Materiał
            </button>
            <button
                onClick={() => setMode("montage")}
                className={cn(
                    "text-sm font-medium py-1.5 px-3 rounded-md transition-all",
                    mode === "montage" 
                        ? "bg-white text-primary shadow-sm ring-1 ring-border" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
            >
                Z Montażem (VAT 8%)
            </button>
         </div>
      )}
        
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
            <Label htmlFor="area">Powierzchnia (m²)</Label>
            <div className="relative">
            <Input
                id="area"
                type="number"
                min="0"
                step="0.01"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="pl-3 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
            </div>
        </div>
        
        <div className="space-y-1.5">
            <Label htmlFor="waste">Zapas (%)</Label>
            <div className="relative">
            <Input
                id="waste"
                type="number"
                min="0"
                max="100"
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
                className="pl-3 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 p-4 border border-border/50 overflow-hidden">
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potrzebne opakowania:</span>
                <span className="font-medium text-foreground">{packsNeeded} szt.</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Łączna powierzchnia:</span>
                <span className="font-medium text-foreground">{totalArea.toFixed(2)} {unit}</span>
            </div>
            {isFlooring && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tolerancja odpadu:</span>
                    <span className="font-medium text-green-600">+{wasteNum}%</span>
                </div>
            )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-end justify-between">
                <span className="text-base font-semibold text-foreground">Razem (brutto):</span>
                <div className="text-right">
                    <span className="text-2xl font-bold text-primary block leading-none">
                        {totalPrice.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block">
                        Cena za {unit}: {pricePerM2} zł
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="pt-2" ref={actionsRef}>
       <AnimatePresence mode="wait">
        {mode === 'material' ? (
            <motion.div
                key="material"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
            >
                <Button 
                    size="lg" 
                    className="w-full text-base font-semibold shadow-md active:scale-95 transition-all"
                    onClick={handleAddToCart}
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Dodaj do koszyka
                </Button>
            </motion.div>
        ) : (
             <motion.div
                key="montage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
            >
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Oszczędzasz VAT (8% zamiast 23%)
                    </p>
                    <p className="opacity-90 leading-relaxed">
                        Skontaktuj się z nami aby otrzymać kompleksową wycenę z montażem.
                    </p>
                </div>
                
                <Button 
                    size="lg" 
                    variant="default"
                    className="w-full text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all"
                    onClick={() => setIsSheetOpen(true)}
                >
                    <Calculator className="mr-2 h-5 w-5" />
                    Zamów bezpłatną wycenę
                </Button>
            </motion.div>
        )}
       </AnimatePresence>
    </div>
    
    <AuditDrawer 
        open={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        defaultValues={{
             area: areaNum,
             productName: product.name
        }}
    />
    </div>
  );
}
