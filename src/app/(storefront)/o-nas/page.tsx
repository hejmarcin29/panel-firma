import Link from "next/link";
import { CheckCircle, Truck, Ruler, Hammer, Phone, Building2, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionContainer, MotionItem } from "@/components/motion-container";

export const metadata = {
  title: "O Nas | Prime Podłoga",
  description: "Poznaj zespół PrimePodloga.pl. Specjaliści od podłóg winylowych i drewnianych z montażem.",
};

export default function AboutUsPage() {
  return (
    <div className="container py-16 md:py-24 space-y-24">
      {/* Intro Section - Narrow */}
      <MotionContainer className="text-center space-y-8 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold font-playfair tracking-tight text-gray-900 leading-tight">
          Tworzymy fundamenty<br/>Twojego domu.
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          PrimePodloga.pl to nie tylko sklep. To zespół ekspertów, którzy od lat pomagają w wyborze, transporcie i profesjonalnym montażu podłóg w całej Polsce.
        </p>
      </MotionContainer>

      {/* Stats Section - Full Width inside Container */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-gray-100">
         <MotionItem delay={0.1} className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-emerald-700 font-playfair">15+</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Lat doświadczenia</div>
         </MotionItem>
         <MotionItem delay={0.2} className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-emerald-700 font-playfair">12k</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">m² ułożonych podłóg</div>
         </MotionItem>
         <MotionItem delay={0.3} className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-emerald-700 font-playfair">850</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Zadowolonych klientów</div>
         </MotionItem>
         <MotionItem delay={0.4} className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-emerald-700 font-playfair">100%</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Terminowości</div>
         </MotionItem>
      </section>

      {/* Story Text */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <MotionContainer delay={0.2} className="relative aspect-square md:aspect-4/5 bg-gray-100 rounded-2xl overflow-hidden">
             {/* Placeholder for Team/Showroom Image */}
             <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                <span className="font-medium text-center px-4">Tu będzie zdjęcie Waszego Zespołu / Showroomu</span>
             </div>
        </MotionContainer>
        <MotionContainer delay={0.4} className="space-y-6">
            <h3 className="text-3xl font-bold font-playfair">Dlaczego my?</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                <p>
                    Historia PrimePodloga.pl zaczęła się od prostej obserwacji: Klienci nie chcą kupować "paczek z panelami". Chcą mieć <strong>gotową, piękną podłogę</strong> w swoim salonie, bez użerania się z ekipami, brakującymi listwami czy reklamacjami.
                </p>
                <p>
                    Dlatego stworzyliśmy model <strong>"Podłoga z Montażem"</strong>. Bierzemy na siebie pełną odpowiedzialność: od pomiaru wilgotności wylewki, przez bezpieczny transport (wniesienie!), aż po montaż z gwarancją.
                </p>
                <p>
                    Współpracujemy z najlepszymi producentami (Egibi, Podłogi z Natury), ale to nasza wiedza techniczna jest tym, co nas wyróżnia. Wiemy, który podkład wyciszy kroki, a który panel przetrwa psie pazury.
                </p>
            </div>
            
            <div className="pt-4">
                <Button size="lg" className="rounded-full" asChild>
                    <Link href="/kontakt">Skontaktuj się z nami</Link>
                </Button>
            </div>
        </MotionContainer>
      </section>

      {/* Values Grid */}
      <section>
          <MotionContainer className="text-3xl font-bold font-playfair mb-12 text-center">Nasze standardy</MotionContainer>
          <div className="grid md:grid-cols-3 gap-8">
            <MotionItem delay={0.1} className="bg-gray-50 p-8 rounded-2xl space-y-4">
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Gwarancja spokoju</h3>
                <p className="text-gray-600">
                    Dajemy pisemną gwarancję nie tylko na produkt, ale też na usługę montażu. Jeden telefon i sprawa załatwiona.
                </p>
            </MotionItem>
            <MotionItem delay={0.2} className="bg-gray-50 p-8 rounded-2xl space-y-4">
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                    <Ruler className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Precyzja co do milimetra</h3>
                <p className="text-gray-600">
                    Nasi montażyści używają laserowego sprzętu pomiarowego i profesjonalnych pił. Żadnych szpar i krzywych cięć.
                </p>
            </MotionItem>
            <MotionItem delay={0.3} className="bg-gray-50 p-8 rounded-2xl space-y-4">
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                    <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Osobisty Doradca</h3>
                <p className="text-gray-600">
                    Nie rozmawiasz z infolinią. Masz swojego dedykowanego opiekuna, który prowadzi Twoje zamówienie od A do Z.
                </p>
            </MotionItem>
          </div>
      </section>

      {/* B2B Section */}
      <MotionContainer delay={0.4} className="flex flex-col md:flex-row items-center gap-8 bg-zinc-900 text-white p-8 md:p-12 rounded-3xl overflow-hidden relative">
          <div className="relative z-10 flex-1 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Building2 className="h-6 w-6" />
                <span className="font-semibold tracking-wide">STREFA B2B</span>
            </div>
            <h2 className="text-3xl font-bold font-playfair">Współpraca dla profesjonalistów</h2>
            <p className="text-gray-300 leading-relaxed">
              Współpracujemy z architektami, deweloperami, sklepami z wyposażeniem wnętrz i ekipami montażowymi. 
              Oferujemy warunki hurtowe, próbniki, wsparcie materiałowe i logistyczne – także przy dużych projektach.
            </p>
            <div className="pt-4">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                    <Link href="/kontakt">Zapytaj o warunki B2B</Link>
                </Button>
            </div>
          </div>
          
          {/* Decorative pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-emerald-900/20 to-transparent pointer-events-none" />
      </MotionContainer>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-gray-700">{children}</span>
        </div>
    );
}
