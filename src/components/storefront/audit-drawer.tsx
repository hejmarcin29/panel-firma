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
  
  // message is now product context only
  const productMessage = productContext 
    ? `Produkt: ${productContext.productName} (~${productContext.area} m²)`
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
                    Pakiet Weryfikacyjny: Audyt + Próbki
                </SheetTitle>
                <SheetDescription className="text-xs">
                    Wypełnij zgłoszenie. Oddzwonimy, aby ustalić dostawę próbek i termin.
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

                 {/* Value Proposition List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">W cenie Pakietu (129 zł):</h4>
                    <ul className="space-y-2">
                         <li className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="bg-green-100 p-0.5 rounded-full mt-0.5">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-700">
                                     <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                 </svg>
                            </div>
                            <span><strong className="text-foreground">Wysyłka Próbek:</strong> Wybrane przez Ciebie wzory wyślemy Kurierem lub do Paczkomatu (my pokrywamy koszt).</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="bg-green-100 p-0.5 rounded-full mt-0.5">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-700">
                                     <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                 </svg>
                            </div>
                            <span><strong className="text-foreground">Wizyta Technika:</strong> Profesjonalny pomiar laserowy, sprawdzenie wilgotności.</span>
                        </li>
                         <li className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="bg-green-100 p-0.5 rounded-full mt-0.5">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-700">
                                     <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                 </svg>
                            </div>
                            <span><strong className="text-foreground">Gwarancja Ilości:</strong> Odpowiedzialność za wyliczony metraż.</span>
                        </li>
                    </ul>
                </div>

                {/* Form */}
                <MeasurementRequestForm 
                    onSuccess={() => onOpenChange(false)}
                    defaultMessage={productMessage}
                />
                
                {/* Timeline / How it works */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Jak to działa?</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                         <div className="flex flex-col items-center gap-1 text-center">
                             <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-600">
                                     <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                                     <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                                 </svg>
                             </div>
                             <span>Zgłoszenie</span>
                         </div>
                         <div className="h-px bg-slate-300 w-full mx-2 mb-4"></div>
                         <div className="flex flex-col items-center gap-1 text-center">
                             <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-600">
                                     <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                                 </svg>
                             </div>
                             <span>Wybór Próbek</span>
                         </div>
                         <div className="h-px bg-slate-300 w-full mx-2 mb-4"></div>
                         <div className="flex flex-col items-center gap-1 text-center">
                              <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-600">
                                     <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                     <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                 </svg>
                             </div>
                             <span>Wysyłka</span>
                         </div>
                    </div>
                </div>
                
                <div className="text-[10px] text-center text-muted-foreground">
                    * Opłata 129 zł zostanie naliczona po potwierdzeniu szczegółów z naszym doradcą.
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
