import Link from "next/link";
import { CheckCircle, Truck, Ruler, Hammer, Phone, Building2, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutUsPage() {
  return (
    <div className="container px-4 md:px-6 py-12 max-w-5xl mx-auto space-y-20">
      {/* Intro Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold font-playfair tracking-tight">
          PrimePodloga.pl – Panele winylowe SPC i LVT z montażem
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Pomagamy wybrać, dostarczyć i ułożyć panele winylowe do domu, mieszkania i inwestycji. 
          Obsługujemy klientów indywidualnych oraz B2B: architektów, deweloperów, sklepy i ekipy montażowe.
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Oferujemy produkty renomowanych marek jak <strong>Egibi Floors</strong> i <strong>Podłogi z Natury</strong>: 
          panele SPC Rigid, LVT, a także listwy, profile i rozwiązania schodowe. 
          Łączymy doradztwo techniczne z realnym doświadczeniem z budów i montaży.
        </p>
      </section>

      {/* Key Features */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center font-playfair">Dlaczego winyle?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />}
                title="Wodoodporność i Trwałość"
                description="100% wodoodporność oraz wysokie klasy użytkowe odpowiednie do intensywnego użytkowania domowego i komercyjnego."
            />
            <FeatureCard 
                icon={<Hammer className="h-8 w-8 text-emerald-600" />}
                title="Szybki Montaż"
                description="Zamki klik (np. Välinge 2G/5G) umożliwiają szybki montaż pływający, idealny przy remontach bez kucia."
            />
            <FeatureCard 
                icon={<UserCheck className="h-8 w-8 text-emerald-600" />}
                title="Bezpieczeństwo"
                description="Certyfikaty jakości (m.in. IAC Gold, CE) – niska emisja substancji lotnych, bezpieczeństwo dla domowników."
            />
        </div>
      </section>

      {/* How We Work Process */}
      <section className="bg-zinc-50 -mx-4 md:-mx-8 p-8 md:p-12 rounded-3xl">
        <h2 className="text-3xl font-bold mb-10 text-center font-playfair">Jak działamy?</h2>
        <div className="grid md:grid-cols-4 gap-8">
            <ProcessStep 
                number="1"
                icon={<Phone className="h-6 w-6" />}
                title="Kontakt"
                description="Telefon, WhatsApp lub formularz. Podaj miasto i orientacyjny metraż."
            />
            <ProcessStep 
                number="2"
                icon={<Ruler className="h-6 w-6" />}
                title="Próbki / Konsultacja"
                description="Dobór dekoru, grubości paneli i akcesoriów pod konkretną inwestycję."
            />
            <ProcessStep 
                number="3"
                icon={<Truck className="h-6 w-6" />}
                title="Sprzedaż i Dostawa"
                description="Wycena, zamówienie i bezpieczna dostawa na inwestycję (cała Polska)."
            />
            <ProcessStep 
                number="4"
                icon={<Hammer className="h-6 w-6" />}
                title="Montaż"
                description="W wybranych regionach umawiamy termin realizacji ze sprawdzoną ekipą."
            />
        </div>
        <div className="mt-8 text-center bg-white p-4 rounded-xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
                Jeśli Twojej lokalizacji nie obsługujemy montażowo – pomożemy dobrać produkty zdalnie lub polecimy partnera.
            </p>
        </div>
      </section>

      {/* Certificates Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6 font-playfair">Certyfikaty jakości i bezpieczeństwa</h2>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
            <ul className="space-y-4">
                <ListItem>Są bezpieczne dla zdrowia i nie zawierają szkodliwych substancji</ListItem>
                <ListItem>Spełniają surowe wymogi certyfikacji jakości powietrza wewnętrznego (Indoor Air Comfort Gold)</ListItem>
                <ListItem>Posiadają znak CE i spełniają normy europejskie</ListItem>
                <ListItem>Oferują wieloletnie gwarancje producenta</ListItem>
            </ul>
        </div>
      </section>

      {/* B2B Section */}
      <section className="flex flex-col md:flex-row items-center gap-8 bg-zinc-900 text-white p-8 md:p-12 rounded-3xl overflow-hidden relative">
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
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-900/20 to-transparent pointer-events-none" />
      </section>

      {/* Final CTA */}
      <div className="text-center pb-8">
        <h3 className="text-2xl font-bold mb-6 font-playfair">Gotowy na nową podłogę?</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="h-12 px-8">
                <Link href="/sklep">Przejdź do sklepu</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <Link href="/kontakt">Skontaktuj się</Link>
            </Button>
        </div>
      </div>
    </div>
  );
}

// Subcomponents for cleaner code
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function ProcessStep({ number, icon, title, description }: { number: string, icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="text-center space-y-3 relative group">
            <div className="relative inline-flex mb-2">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-800 z-10 border border-gray-100 group-hover:border-emerald-200 transition-colors">
                    {icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">
                    {number}
                </div>
            </div>
            <h4 className="font-semibold text-lg">{title}</h4>
            <p className="text-sm text-gray-600 px-2">{description}</p>
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
