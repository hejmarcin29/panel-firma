import { ShieldCheck, Flame, Droplets, PawPrint, Layers, Briefcase } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: PawPrint,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      title: "Dostosowane do zwierząt",
      description: (
        <>
          Powierzchnia odporna na zarysowania pazurami i łatwa w utrzymaniu czystości - bez fug, w których gromadzi się brud.
        </>
      ),
    },
    {
      icon: Layers,
      color: "text-blue-600",
      bg: "bg-blue-50",
      title: "Dwie technologie do wyboru",
      description: (
        <>
          Większość dekorów w wersji <strong className="font-semibold text-foreground">click</strong> lub <strong className="font-semibold text-foreground">klejonej</strong> — dobieramy do warunków Twojego wnętrza.
        </>
      ),
    },
    {
      icon: ShieldCheck,
      color: "text-sky-600",
      bg: "bg-sky-50",
      title: "Trwałość klasy premium",
      description: (
        <>
          Rdzeń SPC i warstwa użytkowa <strong className="font-semibold text-foreground">0,2–0,55 mm</strong> — odporność na wgniecenia. Warstwa ochronna nowej generacji.
        </>
      ),
    },
    {
      icon: Droplets,
      color: "text-cyan-500",
      bg: "bg-cyan-50",
      title: "100% wodoodporne",
      description: (
        <>
          Bez stresu w kuchni, łazience i przedpokoju. Proste sprzątanie i odporność na rozlane płyny.
        </>
      ),
    },
    {
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50",
      title: "Idealne na podłogówkę",
      description: (
        <>
          Niski opór cieplny i szybkie oddawanie ciepła. Idealne rozwiązanie do dużych przestrzeni z ogrzewaniem podłogowym.
        </>
      ),
    },
    {
      icon: Briefcase,
      color: "text-rose-500",
      bg: "bg-rose-50",
      title: "Pomiar i montaż",
      description: (
        <>
          Pomiar → wycena → montaż przez doświadczonych instalatorów (5+ lat) — <strong className="font-semibold text-foreground">8% VAT przy montażu</strong>.
        </>
      ),
    },
  ];

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair">
            Technologia, która ułatwia życie
          </h2>
          <p className="text-muted-foreground text-lg">
            Wybierając nasze podłogi, wybierasz spokój na lata. Zobacz, co nas wyróżnia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
