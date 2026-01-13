import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";

export async function HeroSection() {
  const config = await getShopConfig();
  const backgroundImage = config.heroImage || "https://images.unsplash.com/photo-1581858726768-758a03294c68?q=80&w=2689&auto=format&fit=crop";

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-zinc-900 text-white">
      {/* Background Image/Video Placeholder */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div 
            className="h-full w-full bg-cover bg-center transition-transform hover:scale-105 duration-[20s]"
            style={{ backgroundImage: `url("${backgroundImage}")` }}
        />
      </div>

      <div className="container relative z-20 flex h-full flex-col items-start justify-center pt-20">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm backdrop-blur-md">
            <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Nowa Kolekcja 2026
          </div>
          
          <h1 className="font-playfair text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            {config.heroHeadline || "Podłogi, które tworzą dom."}
          </h1>
          
          <p className="text-lg text-gray-200 sm:text-xl max-w-lg leading-relaxed">
            {config.heroSubheadline || "Odkryj naturalne piękno drewna w nowoczesnym wydaniu. Trwałość na pokolenia, design na czasie."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-base bg-white text-black hover:bg-gray-100 rounded-full" asChild>
              <Link href="/sklep">
                Zobacz Ofertę
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/30 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-sm" asChild>
              <Link href="/kontakt">
                Skontaktuj się <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
