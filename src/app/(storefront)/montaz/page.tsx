import { Container } from "@/components/storefront/container";
import { MeasurementRequestForm } from "@/components/storefront/measurement-request-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Hammer, Ruler, Truck, FileText, Phone, ArrowDownCircle, Info } from "lucide-react";

export const metadata = {
  title: "Montaż Paneli i Podłóg | Profesjonalny Audyt i Wykonawstwo",
  description: "Oferujemy profesjonalny montaż paneli podłogowych. VAT 8%, pisemna gwarancja. Zamów certyfikowany audyt techniczny.",
};

export default function MontazPage() {
  const steps = [
    {
      id: 1,
      title: "Audyt Techniczny",
      desc: "Wypełniasz formularz i opłacasz wizytę technika (129 zł). To gwarancja rezerwacji terminu i profesjonalnej oceny.",
      icon: <Phone className="h-6 w-6 text-white" />,
    },
    {
      id: 2,
      title: "Wizyta i Raport",
      desc: "Ekspert wykonuje pomiary laserowe, bada wilgotność metodą CM i sprawdza równość wylewki. Otrzymujesz raport.",
      icon: <Ruler className="h-6 w-6 text-white" />,
    },
    {
      id: 3,
      title: "Wycena",
      desc: "Otrzymujesz kompletną ofertę (materiał + usługa). Po akceptacji podpisujemy umowę.",
      icon: <FileText className="h-6 w-6 text-white" />,
    },
    {
      id: 4,
      title: "Dostawa",
      desc: "Przywozimy materiał kilka dni wcześniej, aby przeszedł aklimatyzację (min. 24-48h).",
      icon: <Truck className="h-6 w-6 text-white" />,
    },
    {
      id: 5,
      title: "Montaż",
      desc: "Czysty i sprawny montaż podłogi oraz listew. Sprzątamy po sobie. Odbiór prac.",
      icon: <Hammer className="h-6 w-6 text-white" />,
    },
  ];

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold font-playfair">
              Profesjonalny Montaż Podłóg
            </h1>
            <p className="text-slate-300 text-lg">
              Święty spokój w cenie. Zyskaj gwarancję na usługę i niższy VAT 8% na materiał.
            </p>
          </div>
        </Container>
      </div>

      <Container className="mt-12 space-y-16">
        
        {/* Section 1: How it works (Timeline) */}
        <section>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <ArrowDownCircle className="h-6 w-6 text-primary" />
            Jak to działa — 5 kroków
          </h2>
          <div className="relative">
             {/* Mobile: Vertical line, Desktop: Horizontal line could be added with pseudo-elements, 
                 but keeping it simple grid for responsiveness */}
             <div className="grid gap-6 md:grid-cols-5">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative flex flex-col items-center text-center p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                     <div className="absolute top-4 left-4 text-xs font-bold text-slate-200">0{step.id}</div>
                     <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                        {step.icon}
                     </div>
                     <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.desc}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Section 2: Pricing (Rates) */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Przykładowe stawki montażu*</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">SPC / LVT / Winylowe</CardTitle>
                    <CardDescription>Układanie pływające</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">od 40 zł <span className="text-base text-muted-foreground font-normal">/ m²</span></div>
                    <p className="text-sm text-muted-foreground">
                        W cenie: podkład, docinki, dylatacje w standardzie. Bez przygotowania podłoża.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Listwy przypodłogowe</CardTitle>
                    <CardDescription>MDF / Duropolimer / Systemowe</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">od 16 zł <span className="text-base text-muted-foreground font-normal">/ mb</span></div>
                    <p className="text-sm text-muted-foreground">
                        W cenie: docięcia, narożniki (klejenie/słupki), akrylowanie góry.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Przygotowanie podłoża</CardTitle>
                    <CardDescription>Wylewki / Szlifowanie / Gruntowanie</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-700 mb-2">Wycena Indywidualna</div>
                    <p className="text-sm text-muted-foreground">
                        Ustalane na pomiarze. Rozliczenie bezpośrednio z montażystą za chemię i roboczogodziny.
                    </p>
                </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground mt-4">*Ceny orientacyjne netto. Ostateczna kalkulacja po audycie.</p>
        </section>

        {/* Section 3: VAT & Form Split */}
        <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-10">
                {/* VAT Info */}
                <section className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-blue-600" />
                        VAT 8% przy zakupie z montażem
                    </h2>
                    <p className="text-blue-800 mb-4 leading-relaxed">
                        Zgodnie z ustawą o VAT, dla budownictwa mieszkaniowego (mieszkania do 150 m², domy do 300 m²) 
                        możemy zastosować preferencyjną stawkę 8% na całą usługę (robocizna + materiał).
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-blue-100 text-sm text-blue-900">
                        <span className="font-bold block mb-1">Co zyskujesz?</span>
                        Przy zakupie materiału za 10 000 zł netto:<br/>
                        • Z montażem (8%): płacisz 10 800 zł brutto.<br/>
                        • Sam materiał (23%): płacisz 12 300 zł brutto.<br/>
                        <span className="font-bold text-green-600 block mt-2">
                            Oszczędzasz 1500 zł. Różnicę w cenie przeznacz na lepsze listwy lub... wakacje. 🌴
                        </span>
                    </div>
                </section>

                {/* Technical Requirements (Accordion) */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Warunki techniczne / organizacyjne</h2>
                    <Accordion type="single" collapsible className="w-full bg-white rounded-xl border px-4">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-semibold text-left">
                                Temperatura i Wilgotność (Kluczowe!)
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Temperatura w pomieszczeniu: 17–23°C.<br/>
                                Wilgotność powietrza: 40–60% RH.<br/>
                                To kluczowe parametry dla zachowania gwarancji producenta.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-semibold text-left">
                                Równość podłoża
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Max. odchylenie ≤ 3 mm na 2 m długości (chyba że karta produktu stanowi inaczej). 
                                Większe nierówności wymagają wylania masy samopoziomującej.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-semibold text-left">
                                Wilgotność wylewki (CM)
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Jastrych cementowy: ≤ 2.0% CM (z ogrzewaniem ≤ 1.8%).<br/>
                                Anhydryt: ≤ 0.5% CM (z ogrzewaniem ≤ 0.3%).<br/>
                                Weryfikujemy to higrometrem na pomiarze.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="font-semibold text-left">
                                Ogrzewanie podłogowe
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Wymagany jest "Protokół wygrzania wylewki" podpisany przez instalatora CO. 
                                Przed montażem ogrzewanie musi być wyłączone/zredukowane zgodnie z instrukcją.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
                
                {/* FAQ */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">FAQ — Częste pytania</h2>
                    <Accordion type="single" cDlaczego audyt/pomiar kosztuje 129 zł?</AccordionTrigger>
                            <AccordionContent>
                                Opłata pokrywa czas i dojazd certyfikowanego technika. W zamian otrzymujesz <strong>gwarancję poprawności pomiarów</strong>, badanie wilgotności (kluczowe dla gwarancji podłogi!) oraz fachowe doradztwo. 
                                <br/><br/>
                                Środki te trafiają bezpośrednio do montażysty jako wynagrodzenie za wykonaną ekspertyzę. Raport z pomiaru jest Twoją własnością — nawet jeśli nie zdecydujesz się na naszą usługę
                            <AccordionContent>
                                Nie. Wstępna wizyta i pomiar są bezpłatne (gratis) na terenie naszego działania.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="faq-2">
                            <AccordionTrigger>Ile trwa realizacja?</AccordionTrigger>
                            <AccordionContent>
                                Standardowy montaż mieszkania (ok. 50-70 m²) zajmuje zazwyczaj 2-3 dni robocze.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="faq-3">
                            <AccordionTrigger>Czy montujecie same listwy?</AccordionTrigger>
                            <AccordionContent>
                                Tak, ale preferujemy zlecenia kompleksowe. Przy samym montażu listew stawka może być wyższa ze względu na dojazd.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
            </div>

            {/* Right Column: Sticky Form */}Audyt Techniczny</h3>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-bold text-primary">129 zł</span>
                            <span className="text-sm text-muted-foreground">/ wizyta</span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Wypełnij formularz. Technik skontaktuje się w ciągu 24h, aby potwierdzić termin.
                        </p>
                    </div>
                    
                    <MeasurementRequestForm 
                        defaultMessage="Dzień dobry. Proszę o termin audytu technicznego (129 zł). Adres inwestycji..."
                    />
                </div>

                <div className="mt-6 bg-slate-100 rounded-xl p-4 flex gap-4 items-start">
                     <Info className="shrink-0 text-slate-500 mt-0.5" />
                     <p className="text-xs text-slate-600">
                        Opłacając audyt, unikasz ryzyka błędnych pomiarów i montażu na wilgotnym podłożu. To Twoja polisa bezpieczeństwa
                     <Info className="shrink-0 text-slate-500 mt-0.5" />
                     <p className="text-xs text-slate-600">
                        Nie musisz znać dokładnego metrażu ani wybierać konkretnej podłogi. 
                        Na pomiarze nasz technik będzie miał wzorniki i doradzi najlepsze rozwiązanie.
                     </p>
                </div>
            </div>
        </div>

      </Container>
    </div>
  );
}
