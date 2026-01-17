"use client";

import { useState } from "react";
import { Container } from "@/components/storefront/container";
// import { MeasurementRequestForm } from "@/components/storefront/measurement-request-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditDrawer } from "@/components/storefront/audit-drawer";
import { Phone, Ruler, FileText, Truck, Hammer, Calculator, ShieldCheck, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function MontazContent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Zgłoszenie i Próbki",
      desc: "Wypełniasz formularz. My dzwonimy i wysyłamy Ci link do wyboru darmowych próbek, które wyślemy Kurierem.",
      icon: <Phone className="h-6 w-6 text-white" />,
    },
    {
      id: 2,
      title: "Wizyta Technika",
      desc: "Ekspert wykonuje pomiary laserowe w Twoim domu, bada wilgotność i ocenia podłoże.",
      icon: <Ruler className="h-6 w-6 text-white" />,
    },
    {
      id: 3,
      title: "Wycena",
      desc: "Otrzymujesz kompletną ofertę (materiał + usługa + logistyka). Po akceptacji podpisujemy umowę.",
      icon: <FileText className="h-6 w-6 text-white" />,
    },
    {
      id: 4,
      title: "Dostawa Materiału",
      desc: "Dostarczamy zamówioną podłogę. Musisz ją odebrać i wnieść, aby przeszła aklimatyzację (min. 48h).",
      icon: <Truck className="h-6 w-6 text-white" />,
    },
    {
      id: 5,
      title: "Profesjonalny Montaż",
      desc: "Czysty i sprawny montaż podłogi oraz listew. Sprzątamy po sobie. Odbiór prac.",
      icon: <Hammer className="h-6 w-6 text-white" />,
    },
  ];

  return (
    <div className="bg-background min-h-screen pb-24 md:pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800/20 skew-x-12 translate-x-20 pointer-events-none" />
        
        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold font-playfair tracking-tight">
              Podłoga na lata.<br/>Bez stresu.
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Święty spokój w cenie. Zleć to certyfikowanym ekspertom. <br className="hidden md:block"/>
              Zyskaj gwarancję na usługę i niższy VAT 8% na materiał.
            </p>
            
            <div className="pt-4 flex flex-col md:flex-row gap-4 justify-center items-center">
                <Button 
                    size="lg" 
                    onClick={() => setIsSheetOpen(true)}
                    className="h-14 px-8 text-lg font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-transform active:scale-95 border-b-4 border-slate-300 rounded-xl"
                >
                    <Calculator className="mr-2 h-5 w-5" />
                    Zamów Pakiet Weryfikacyjny
                </Button>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    Próbki w cenie + Gwarancja
                </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="mt-16 space-y-24 max-w-5xl mx-auto">
        
        {/* Section 1: How it works (Timeline) */}
        <section>
          <h2 className="text-2xl font-bold mb-10 flex items-center justify-center gap-2 text-center">
            <ArrowDownCircle className="h-6 w-6 text-primary" />
            Jak to działa — proces z gwarancją spokoju
          </h2>
          <div className="grid gap-8 md:grid-cols-5">
            {steps.map((step) => (
                <div key={step.id} className="relative flex flex-col items-center text-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-4 left-4 text-xs font-bold text-slate-100 group-hover:text-slate-200 transition-colors">0{step.id}</div>
                    <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    {step.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                    </p>
                </div>
            ))}
          </div>
        </section>

        {/* Section 2: Pricing Cards */}
        <section className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
          <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Przejrzyste stawki</h2>
              <p className="text-muted-foreground">Wiesz za co płacisz. Zero ukrytych kosztów.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">SPC / LVT / Winylowe</CardTitle>
                    <CardDescription>Układanie pływające</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-primary mb-2">od 40 zł <span className="text-base text-muted-foreground font-normal">/ m²</span></div>
                    <p className="text-sm text-muted-foreground mt-4">
                        W cenie: podkład, docinki, dylatacje w standardzie. Bez przygotowania podłoża.
                    </p>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 relative overflow-hidden">
                {/* Opcjonalny dekoracyjny badge w tle */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0 pointer-events-none opacity-50" />
                
                <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-lg">Wykończenie i Detale</CardTitle>
                    <CardDescription>Listwy, progi, estetyka</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-slate-700 mb-2">Ustalane z Instalatorem</div>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                        To detale tworzą efekt. Dobór listew, obróbka progów i łączenia z płytkami to kwestie indywidualne. Zakres i stawkę ustalisz bezpośrednio z ekspertem na miejscu.
                    </p>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-slate-900 text-white">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white">Przygotowanie podłoża</CardTitle>
                    <CardDescription className="text-slate-400">Klucz do trwałości</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-2">Wycena Indywidualna</div>
                    <p className="text-sm text-slate-400 mt-4">
                        Szlifowanie, gruntowanie, wylewki samopoziomujące. Ustalane podczas audytu.
                    </p>
                </CardContent>
            </Card>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">*Ceny orientacyjne netto. Ostateczna kalkulacja po audycie.</p>
        </section>

        {/* Section 3: Value Proposition (VAT & Info) */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
             {/* VAT Info */}
             <div className="space-y-6">
                <div className="bg-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-blue-900/10">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-blue-200" />
                        Oszczędzaj z VAT 8%
                    </h2>
                    <p className="text-blue-100 mb-6 leading-relaxed">
                        Zgodnie z ustawą, dla budownictwa mieszkaniowego (do 150/300 m²) stosujemy preferencyjną stawkę 8% na usługę kompleksową.
                    </p>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                        <div className="text-sm font-medium text-blue-50 mb-1 uppercase tracking-wider">Kalkulacja dla 10 000 zł netto</div>
                        <div className="flex justify-between items-end border-b border-white/20 pb-2 mb-2">
                             <span>Materiał (23% VAT)</span>
                             <span className="opacity-70 line-through">12 300 zł</span>
                        </div>
                        <div className="flex justify-between items-end font-bold text-xl">
                             <span>Z montażem (8% VAT)</span>
                             <span>10 800 zł</span>
                        </div>
                        <div className="mt-3 text-sm font-semibold text-green-300 flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4" />
                             Oszczędzasz 1500 zł
                        </div>
                    </div>
                     <p className="mt-4 text-xs text-blue-200 text-center font-medium">
                        Więcej niż koszt pakietu weryfikacyjnego (129 zł).
                    </p>
                </div>
            </div>

            {/* Technical Requirements & FAQ */}
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold mb-4 px-2">Warunki techniczne</h3>
                    <Accordion type="single" collapsible className="w-full bg-white rounded-xl border px-4 shadow-sm">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-semibold text-left">Temperatura i Wilgotność</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Temp: 17–23°C. Wilgotność powietrza: 40–60% RH. To krytyczne dla utrzymania gwarancji.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-semibold text-left">Równość podłoża</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Max. odchylenie ≤ 3 mm na 2 m. Większe nierówności wymagają wylewki samopoziomującej.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-semibold text-left">Wilgotność wylewki (Badanie CM)</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                Cement: ≤ 2.0% CM. Anhydryt: ≤ 0.5% CM. Mierzymy to podczas audytu (w cenie).
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4 px-2">Częste pytania</h3>
                    <Accordion type="single" collapsible className="w-full">
                         <AccordionItem value="faq-1">
                            <AccordionTrigger>Dlaczego audyt kosztuje 129 zł?</AccordionTrigger>
                            <AccordionContent>
                                To nie jest &quot;rzucenie okiem&quot;. To procedura techniczna z użyciem sprzętu pomiarowego (laser, higrometr CM). 
                                129 zł to wynagrodzenie technika za jego czas, dojazd i sporządzenie wiążącego raportu z odpowiedzialnością.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="faq-2">
                            <AccordionTrigger>Czy montujecie w całej Polsce?</AccordionTrigger>
                            <AccordionContent>
                                Działamy głównie w promieniu 100km od naszej siedziby. W przypadku większych inwestycji (&gt;150 m²) możliwy dojazd w dalsze rejony.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>

      </Container>

      {/* Sticky Bottom Bar for Mobile */}
      <AnimatePresence>
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-40 md:hidden shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pb-safe"
        >
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Audyt Techniczny</div>
                    <div className="font-bold text-lg text-primary">129 zł <span className="text-sm font-normal text-gray-500">/ wizyta</span></div>
                </div>
                <Button onClick={() => setIsSheetOpen(true)} className="shadow-lg shadow-primary/20">
                    Zamów
                </Button>
            </div>
        </motion.div>
      </AnimatePresence>

      {/* THE DRAWER (SHEET) */}
      <AuditDrawer 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}
