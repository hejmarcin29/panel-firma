import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionContainer, MotionItem } from "@/components/motion-container";

export const metadata = {
  title: "Kontakt | Prime Podłoga",
  description: "Skontaktuj się z nami. Salon sprzedaży, obsługa inwestycji, współpraca B2B.",
};

export default function ContactPage() {
  return (
    <div className="container py-16 md:py-24 space-y-16">
      {/* Header */}
      <MotionContainer className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold font-playfair">Jesteśmy do Twojej dyspozycji</h1>
        <p className="text-xl text-gray-600">
          Masz pytania o produkt? Potrzebujesz wyceny montażu? 
          Nasi eksperci czekają na kontakt.
        </p>
      </MotionContainer>

      {/* Contact Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Phone */}
        <MotionItem delay={0.1} className="bg-gray-50 p-8 rounded-2xl text-center space-y-4">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600 mx-auto">
                <Phone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Zadzwoń do nas</h3>
            <p className="text-gray-600">Pon-Pt: 8:00 - 16:00</p>
            <a href="tel:+48123456789" className="text-2xl font-bold text-emerald-700 hover:text-emerald-800 block mt-2">
                +48 123 456 789
            </a>
        </MotionItem>

        {/* Email */}
        <MotionItem delay={0.2} className="bg-gray-50 p-8 rounded-2xl text-center space-y-4">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600 mx-auto">
                <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Napisz do nas</h3>
            <p className="text-gray-600">Odpowiadamy w 24h</p>
            <a href="mailto:kontakt@primepodloga.pl" className="text-xl font-bold text-emerald-700 hover:text-emerald-800 block mt-2">
                kontakt@primepodloga.pl
            </a>
        </MotionItem>

        {/* Showroom */}
        <MotionItem delay={0.3} className="bg-gray-50 p-8 rounded-2xl text-center space-y-4">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600 mx-auto">
                <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Odbiór osobisty</h3>
            <p className="text-gray-600">Magazyn Główny</p>
            <div className="font-medium text-gray-900 mt-2">
                ul. Przykładowa 123<br/>
                00-000 Warszawa
            </div>
        </MotionItem>
      </div>

       {/* Map / Additional Info */}
       <MotionContainer delay={0.4} className="bg-zinc-900 text-white p-8 md:p-12 rounded-3xl text-center">
            <h2 className="text-2xl font-bold font-playfair mb-4">Współpraca B2B</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                Jesteś architektem, deweloperem lub prowadzisz firmę wykonawczą? 
                Skontaktuj się z naszym działem inwestycji, aby otrzymać ofertę hurtową.
            </p>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                Dział Inwestycji B2B
            </Button>
       </MotionContainer>
    </div>
  );
}
