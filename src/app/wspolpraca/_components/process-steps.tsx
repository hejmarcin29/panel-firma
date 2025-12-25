'use client';

import { motion } from 'framer-motion';
import { UserPlus, Palette, Hammer, Banknote } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: 'Zarejestruj się',
        description: 'Wypełnij krótki formularz i dołącz do grona zweryfikowanych partnerów.',
        icon: UserPlus,
    },
    {
        id: 2,
        title: 'Wybierz produkty',
        description: 'Korzystaj z naszego wzornika i próbek podczas spotkań z klientami.',
        icon: Palette,
    },
    {
        id: 3,
        title: 'My realizujemy',
        description: 'Zajmujemy się logistyką, wniesieniem i profesjonalnym montażem.',
        icon: Hammer,
    },
    {
        id: 4,
        title: 'Odbierz prowizję',
        description: 'Po opłaceniu zamówienia przez klienta, otrzymujesz przelew w 7 dni.',
        icon: Banknote,
    },
];

export function ProcessSteps() {
  return (
    <section className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Jak to działa?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Prosty proces współpracy, minimum formalności.
            </p>
        </div>

        <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow duration-300"
                    >
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <step.icon className="w-8 h-8" />
                        </div>
                        <div className="absolute top-4 right-4 text-6xl font-bold text-gray-50 opacity-50 select-none -z-10">
                            {step.id}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
}
