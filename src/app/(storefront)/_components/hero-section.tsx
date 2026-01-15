import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";

export async function HeroSection() {
  const config = await getShopConfig();
  const backgroundImage = config.heroImage || "https://images.unsplash.com/photo-1581858726768-758a03294c68?q=80&w=2689&auto=format&fit=crop";

  return (
    <section className="relative w-full overflow-hidden bg-slate-50">
      <div className="container relative z-10 flex flex-col-reverse lg:flex-row items-center gap-12 py-16 lg:py-24">
        
        {/* Left Column: Content */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="font-playfair text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:leading-[1.1]">
              {config.heroHeadline || "Jedna podłoga. Wszystko, czego potrzebujesz."}
            </h1>
            
            <p className="mx-auto lg:mx-0 max-w-lg text-lg text-slate-600 sm:text-xl leading-relaxed">
              {config.heroSubheadline || "Sprawdzone panele winylowe SPC i LVT – montowane przez nasz zespół."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button size="lg" className="h-12 px-8 text-base bg-[#c0392b] hover:bg-[#a93226] text-white rounded-md shadow-md" asChild>
              <Link href="/sklep">
                Zobacz dekory
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-[#c0392b] text-[#c0392b] hover:bg-red-50 rounded-md bg-transparent" asChild>
              <Link href="/sklep">
                Produkty
              </Link>
            </Button>
          </div>
          
           <p className="text-sm text-slate-500">
             Prime Podłoga to oficjalny dystrybutor Podłogi z Natury i Egibi Floors.
           </p>
        </div>

        {/* Right Column: Image */}
        <div className="flex-1 w-full max-w-xl lg:max-w-none">
           <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-200 shadow-xl relative">
              <div 
                  className="absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
                  style={{ backgroundImage: `url("${backgroundImage}")` }}
              />
           </div>
        </div>

      </div>
    </section>
  );
}
