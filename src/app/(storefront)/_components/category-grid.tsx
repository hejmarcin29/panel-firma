import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CategoryGrid() {
  return (
    <section className="py-20 md:py-28">
      <div className="container space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold tracking-tight">
              Wyselekcjonowane kolekcje
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg">
              Znajdź styl idealnie dopasowany do Twojego wnętrza.
            </p>
          </div>
          <Link 
            href="/kolekcje" 
            className="group flex items-center text-sm font-medium hover:text-primary transition-colors"
          >
            Zobacz wszystkie kategorie
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 h-[1200px] md:h-[600px]">
          {/* Main Large Item */}
          <Link href="/kolekcje/dab-naturalny" className="group relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 bg-gray-100">
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2684&auto=format&fit=crop")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 space-y-2 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Bestseller</span>
              <h3 className="font-playfair text-3xl font-bold">Dąb Naturalny</h3>
              <p className="text-gray-200">Klasyka, która nigdy nie wychodzi z mody.</p>
            </div>
          </Link>

          {/* Secondary Item Top */}
          <Link href="/kolekcje/jodelka-francuska" className="group relative overflow-hidden rounded-2xl bg-gray-100">
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1588854337442-df463ae37d97?q=80&w=2670&auto=format&fit=crop")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 space-y-1 text-white">
              <h3 className="font-playfair text-xl font-bold">Jodełka Francuska</h3>
              <p className="text-sm text-gray-200">Elegancja pałacowych wnętrz.</p>
            </div>
          </Link>

          {/* Secondary Item Bottom */}
          <Link href="/kolekcje/podlogi-winylowe" className="group relative overflow-hidden rounded-2xl bg-gray-100">
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1481277542470-60561660673e?q=80&w=2697&auto=format&fit=crop")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 space-y-1 text-white">
              <h3 className="font-playfair text-xl font-bold">Winylowe SPC</h3>
              <p className="text-sm text-gray-200">Wodoodporne i trwałe.</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
