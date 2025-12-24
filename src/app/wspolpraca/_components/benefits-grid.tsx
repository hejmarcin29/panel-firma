'use client';

import { motion } from 'framer-motion';
import { Banknote, ShieldCheck, Truck, Clock, Users } from 'lucide-react';

const benefits = [
    {
        title: "Prowizja",
        description: "Jasne zasady. Faktura B2B. Przelew w 7 dni.",
        icon: Banknote,
        className: "md:col-span-2 md:row-span-2 bg-blue-600 text-white",
        iconColor: "text-blue-200"
    },
    {
        title: "Spokój",
        description: "Bierzemy odpowiedzialność za pomiar.",
        icon: ShieldCheck,
        className: "bg-gray-100 text-gray-900",
        iconColor: "text-blue-600"
    },
    {
        title: "Logistyka",
        description: "Wnosimy, montujemy, sprzątamy.",
        icon: Truck,
        className: "bg-gray-100 text-gray-900",
        iconColor: "text-purple-600"
    },
    {
        title: "Czas",
        description: "Oszczędzasz godziny na telefonach.",
        icon: Clock,
        className: "bg-gray-900 text-white",
        iconColor: "text-yellow-400"
    },
    {
        title: "Wsparcie",
        description: "Dedykowany opiekun architekta.",
        icon: Users,
        className: "bg-gray-100 text-gray-900",
        iconColor: "text-green-600"
    },
];

export function BenefitsGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Dlaczego my?</h2>
            <p className="text-xl text-gray-600">Model współpracy zaprojektowany przez profesjonalistów dla profesjonalistów.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]">
            {benefits.map((benefit, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 ${benefit.className}`}
                >
                    <div>
                        <benefit.icon className={`h-10 w-10 mb-4 ${benefit.iconColor}`} />
                        <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
                        <p className="text-lg opacity-80">{benefit.description}</p>
                    </div>
                    {index === 0 && (
                        <div className="mt-4">
                            <div className="text-5xl font-bold opacity-20">$$$</div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
