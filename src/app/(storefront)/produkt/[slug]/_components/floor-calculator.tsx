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
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { calculateMontageEstimation, submitMontageLead } from "@/server/actions/calculator-actions";
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
    isPurchasable = false,
    samplePrice,
    isSampleAvailable,
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
  const [estimation, setEstimation] = useState<{
    totalGross8: number;
    vatSavings: number;
    priceRange: { min: number; max: number };
  } | null>(null);

  // Sticky Bar Logic
  const actionsRef = useRef<HTMLDivElement>(null);
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

  const handleAddSampleToCart = () => {
      if (addItem({
          productId: `sample_${product.id}`,
          name: `Próbka: ${product.name}`,
          sku: `SAMPLE-${product.sku}`,
          image: product.imageUrl,
          pricePerUnit: samplePrice || 20,
          vatRate: 0.23,
          quantity: 1,
          unit: 'szt.',
          packageSize: 0
      })) {
        toast.success("Dodano próbkę do koszyka");
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

      {/* Mode Switcher */}
      {isFlooring && (
         <div className="bg-muted p-1 rounded-lg grid grid-cols-2 gap-1 mb-4">
            <button
                onClick={() => setMode("material")}
                className={cn(
                    "relative z-10 py-2 px-3 text-sm font-medium rounded-md transition-colors",
                    mode === "material" 
                        ? "text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                {mode === "material" && (
                    <motion.div
                        layoutId="active-mode-tab"
                        className="absolute inset-0 bg-background shadow-sm rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                📦 Tylko Materiał
            </button>
            <button
                onClick={() => setMode("montage")}
                className={cn(
                    "relative z-10 py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2",
                    mode === "montage" 
                        ? "text-primary font-bold" 
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                {mode === "montage" && (
                    <motion.div
                        layoutId="active-mode-tab"
                        className="absolute inset-0 bg-background shadow-sm rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                🛠️ Z Montażem <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full ml-1">-15%</span>
            </button>
         </div>
      )}
        
      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Powierzchnia (m²)</Label>
            <div className="relative">
                <Input 
                type="number" 
                value={area} 
                onChange={(e) => setArea(e.target.value)}
                min="1"
                className="text-lg pr-8 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">m²</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Zapas (%)</Label>
            <div className="flex bg-muted rounded-md p-1 h-10 w-full">
               {[currentRates.simple, currentRates.complex].map((val) => (
                 <button
                   key={val}
                   onClick={() => setWaste(val.toString())}
                   className={cn(
                     "flex-1 rounded-sm text-xs font-medium transition-all",
                     waste === val.toString() 
                       ? "bg-white shadow text-black" 
                       : "text-gray-500 hover:text-gray-900"
                   )}
                 >
                   {val === currentRates.simple ? 'Proste' : 'Skosy'} ({val}%)
                 </button>
               ))}
            </div>
          </div>
      </div>

      {/* Results Section */}
      <div className="rounded-lg bg-muted/30 p-4 border border-border/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'material' ? (
             <motion.div 
                key="material-calc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
             >
                <div className="flex justify-between text-sm">
                    <span>Potrzebujesz:</span>
                    <span className="font-medium">{areaWithWaste.toFixed(2)} m²</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                    <span>Ilość paczek:</span>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-lg">{packsNeeded} op.</span>
                        {isFlooring && packageSizeM2 > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                                (1 op. = {packageSizeM2} m²)
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground border-t pt-2 mt-2">
                    <span>Razem do zamówienia:</span>
                    <span>{totalArea.toFixed(2)} m²</span>
                </div>
             </motion.div>
          ) : (
             <motion.div 
                key="montage-est"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
             >
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Szacowany koszt inwestycji:</span>
                 </div>
                 {estimation ? (
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                     >
                        <div className="flex items-baseline gap-2">
                             <span className="text-2xl font-bold text-gray-900">
                                 {estimation.priceRange.min} - {estimation.priceRange.max} zł
                             </span>
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Oszczędzasz ok. {Math.round(estimation.vatSavings)} zł na VAT 8%
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                            W cenie: Materiał, montaż, chemia montażowa, listwy, pomiar, gwarancja.
                        </p>
                     </motion.div>
                 ) : (
                     <div className="h-12 w-full animate-pulse bg-gray-200 rounded"></div>
                 )}
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-2" ref={actionsRef}>
       <AnimatePresence mode="wait">
        {mode === 'material' ? (
            <motion.div
                key="material-actions"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
            >
                <div className="flex items-end justify-between mb-4">
                    <span className="text-muted-foreground text-sm">Cena towaru:</span>
                    <span className="text-3xl font-bold tracking-tight text-primary">
                        {totalPrice.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                    </span>
                </div>
                
                {isPurchasable ? (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button size="lg" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={handleAddToCart}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Dodaj do koszyka
                        </Button>
                    </motion.div>
                ) : (
                    <Button size="lg" disabled className="w-full h-12 text-base font-semibold opacity-75 cursor-not-allowed" variant="secondary">
                        Produkt niedostępny online
                    </Button>
                )}

                {isSampleAvailable && (
                    <Button 
                        variant="outline" 
                        className="w-full h-10 mt-3 text-sm border-gray-300 hover:bg-gray-50 text-gray-700"
                        onClick={handleAddSampleToCart}
                    >
                        Zamów próbkę ({samplePrice?.toFixed(2)} zł)
                    </Button>
                )}
            </motion.div>
        ) : (
             <motion.div
                key="montage-actions"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
             >
                 <AuditDrawer 
                    open={isSheetOpen} 
                    onOpenChange={setIsSheetOpen}
                    productContext={{
                        productName: product.name,
                        sku: product.sku,
                        area: area,
                        estimation: estimation
                    }}
                 >
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button size="lg" className="w-full h-12 text-base font-semibold bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-900/10">
                                <Calculator className="mr-2 h-5 w-5" />
                                Umów Audyt (129 zł)
                            </Button>
                        </motion.div>
                 </AuditDrawer>
             </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
