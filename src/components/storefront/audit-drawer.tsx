"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MeasurementRequestForm } from "@/components/storefront/measurement-request-form";
import { ShieldCheck, Info } from "lucide-react";
// import { ReactNode } from "react";

export interface AuditProductContext {
  productName: string;
  sku: string;
  area: string;
  estimation?: {
    totalGross8: number;
    vatSavings: number;
  } | null;
}

interface AuditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productContext?: AuditProductContext;
}

export function AuditDrawer({ open, onOpenChange, productContext }: AuditDrawerProps) {
  
  // Generujemy wiadomość tylko jeśli mamy kontekst produktu (Kalkulator)
  const productMessage = productContext 
    ? `Produkt: ${productContext.productName} (~${productContext.area} m²)

Adres inwestycji: ...
Stan: Nowy dom / Remont
Podłoże: ...`
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-[20px] lg:rounded-none lg:max-w-md h-[85vh] lg:h-full flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()} // BLOKADA KLAWIATURY
      >
        <div className="flex flex-col h-full bg-white">
            <SheetHeader className="text-left space-y-2 p-6 pb-2 border-b bg-white">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Zamów Audyt Techniczny
                </SheetTitle>
                <SheetDescription className="text-xs">
                    Wypełnij dane. Technik skontaktuje się w 24h, aby potwierdzić termin.
                </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Product Context Logic (dla Kalkulatora) */}
                {productContext && (
                    <div className="bg-blue-50/50 rounded-xl p-4 space-y-2 border border-blue-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Produkt:</span>
                            <span className="font-semibold text-gray-900 truncate max-w-[180px]">{productContext.productName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Powierzchnia:</span>
                            <span className="font-medium">{productContext.area} m²</span>
                        </div>
                        {productContext.estimation && (
                        <div className="flex justify-between text-sm pt-2 border-t border-blue-100 mt-2">
                            <span className="text-gray-500">Szac. koszt podłogi:</span>
                            <span className="font-bold text-blue-700">
                                ~{Math.round(productContext.estimation.totalGross8)} zł
                            </span>
                        </div>
                        )}
                    </div>
                )}

                {/* Price Context (Zawsze widoczne) */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                     <div>
                        <div className="text-xs text-slate-600 font-semibold uppercase">Koszt usługi audytu</div>
                        <div className="text-[10px] text-slate-500">Płatne przelewem / BLIK</div>
                     </div>
                     <div className="text-xl font-bold text-slate-700">129 zł</div>
                </div>

                {!productContext && (
                    <div className="text-xs text-muted-foreground bg-slate-50/50 p-2 rounded-lg flex gap-2">
                        <Info className="h-4 w-4 shrink-0" />
                        Opłata obejmuje dojazd, pomiary laserowe i kosztorys. Gwarantuje rezerwację terminu.
                    </div>
                )}

                {/* Form */}
                <MeasurementRequestForm 
                    onSuccess={() => onOpenChange(false)}
                    defaultMessage={productMessage}
                />
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
