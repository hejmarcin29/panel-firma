'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "Jak szybko wypłacana jest prowizja?",
        answer: "Prowizję wypłacamy w ciągu 7 dni od momentu opłacenia zamówienia przez klienta końcowego. Działamy na podstawie faktury VAT lub rachunku."
    },
    {
        question: "Czy otrzymam wzorniki produktów?",
        answer: "Tak, każdy zweryfikowany partner otrzymuje od nas Box Architekta zawierający próbki naszych bestsellerowych podłóg winylowych oraz wzorniki listew."
    },
    {
        question: "Na jakim obszarze działacie?",
        answer: "Nasze ekipy montażowe działają głównie na terenie województwa śląskiego i małopolskiego. Samą sprzedaż materiałów realizujemy na terenie całej Polski z dostawą w 24-48h."
    },
    {
        question: "Czy klient może zobaczyć podłogi na żywo?",
        answer: "Oczywiście. Zapraszamy do naszego showroomu lub możemy wysłać próbki bezpośrednio do klienta. Dodatkowo, nasz mobilny doradca może podjechać na inwestycję z pełnymi wzornikami."
    },
    {
        question: "Czy pomagacie w doborze technologii?",
        answer: "Tak. Nasi eksperci doradzą, czy w danym przypadku lepiej sprawdzi się montaż na klej (Dryback) czy na klik (SPC), biorąc pod uwagę ogrzewanie podłogowe, nasłonecznienie i stan wylewki."
    }
];

export function FAQ() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Częste pytania</h2>
            <p className="text-lg text-gray-600">
                Wszystko, co musisz wiedzieć o współpracy z nami.
            </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-lg font-medium text-gray-900">
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 text-base leading-relaxed">
                        {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </div>
    </section>
  );
}
