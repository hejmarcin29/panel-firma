import { getStoreCollections } from "../sklep/actions";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MotionContainer, MotionItem } from "@/components/motion-container";

export const metadata = {
  title: "Kolekcje Podłóg | Prime Podłoga",
  description: "Odkryj wyjątkowe kolekcje podłóg winylowych i drewnianych. Znajdź styl idealny do swojego wnętrza.",
};

export default async function CollectionsPage() {
  const collections = await getStoreCollections();

  return (
    <div className="container py-16 space-y-16">
      {/* Hero Section */}
      <MotionContainer className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold font-playfair">
          Nasze Kolekcje
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Każda kolekcja to inna historia i inny charakter wnętrza. 
          Od klasycznego drewna po nowoczesny beton. Wybierz styl, który pasuje do Ciebie.
        </p>
      </MotionContainer>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections.map((collection, index) => (
          <MotionItem 
            key={collection.id} 
            delay={index * 0.1}
          >
            <Link 
                href={`/sklep?collections=${collection.slug}`}
                className="group block space-y-4"
            >
                {/* Image Card */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 border border-gray-100 isolate">
                {collection.imageUrl ? (
                    <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url("${collection.imageUrl}")` }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        <span className="text-sm">Brak zdjęcia</span>
                    </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 z-10 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-playfair group-hover:text-emerald-700 transition-colors">
                    {collection.name}
                    </h2>
                    <ArrowRight className="h-5 w-5 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 text-emerald-700" />
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                    {collection.description || "Zobacz produkty z tej wyjątkowej kolekcji."}
                </p>
                </div>
            </Link>
          </MotionItem>
        ))}
      </div>

      {collections.length === 0 && (
        <MotionContainer delay={0.2} className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Brak kolekcji</h3>
            <p className="text-gray-500 mt-2">Aktualnie nie mamy zdefiniowanych kolekcji.</p>
        </MotionContainer>
      )}
    </div>
  );
}
