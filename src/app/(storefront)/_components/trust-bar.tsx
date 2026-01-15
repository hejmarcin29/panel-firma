import { Truck, Hammer, ShieldCheck } from "lucide-react";

export function TrustBar() {
  return (
    <section className="bg-white border-b py-8">
      <div className="container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 gap-y-12">
            
            {/* Logos */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Logo Placeholders - Style them to look like branding */}
                <div className="text-xl font-bold tracking-tight text-slate-800 font-serif">
                   PODŁOGI Z NATURY
                </div>
                <div className="text-xl font-extrabold tracking-tight text-slate-800">
                   EGIBI<span className="text-[#c0392b]">FLOORS</span>
                </div>
                <div className="text-xl font-semibold tracking-tighter text-slate-600">
                   SWISS KRONO
                </div>
                 <div className="text-xl font-bold tracking-widest text-slate-700">
                   ARBITON
                </div>
            </div>

            {/* Features/Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm  text-slate-600">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-full text-[#c0392b]">
                         <Truck className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Własny transport</span>
                </div>
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 rounded-full text-[#c0392b]">
                        <Hammer className="h-5 w-5" />
                     </div>
                    <span className="font-medium">Montaż w cenie</span>
                </div>
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 rounded-full text-[#c0392b]">
                        <ShieldCheck className="h-5 w-5" />
                     </div>
                    <span className="font-medium">Gwarancja jakości</span>
                </div>
            </div>
            
        </div>
      </div>
    </section>
  );
}
