import { Truck, ShieldCheck, Ruler, Leaf } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Ekologiczne surowce",
    description: "Drewno pozyskiwane wyłącznie z certyfikowanych, odnawialnych źródeł.",
  },
  {
    icon: ShieldCheck,
    title: "25 lat gwarancji",
    description: "Pewność inwestycji dzięki naszej rozszerzonej gwarancji producenta.",
  },
  {
    icon: Ruler,
    title: "Montaż na wymiar",
    description: "Profesjonalny zespół montażystów zadba o każdy, nawet najtrudniejszy detal.",
  },
  {
    icon: Truck,
    title: "Szybka dostawa",
    description: "Większość podłóg dostępna od ręki w naszym magazynie centralnym.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 bg-muted/30 border-y">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
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
