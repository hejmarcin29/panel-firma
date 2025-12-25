'use client';

import { motion } from 'framer-motion';

const realizations = [
    { 
        id: 1, 
        title: 'Apartament w Centrum', 
        location: 'Warszawa',
        image: 'https://primepodloga.pl/wp-content/uploads/2025/10/20251028_114834-840x630.jpg.webp',
        description: 'Realizacja z wykorzystaniem jodełki Harrison.'
    },
    { 
        id: 2, 
        title: 'Dom Jednorodzinny', 
        location: 'Kraków',
        image: 'https://primepodloga.pl/wp-content/uploads/2025/10/20251028_114756-840x630.jpg',
        description: 'Przytulne wnętrze z podłogą Whistler.'
    },
    { 
        id: 3, 
        title: 'Nowoczesne Biuro', 
        location: 'Wrocław',
        image: 'https://primepodloga.pl/wp-content/uploads/2025/01/MADERA-1529x1536-1-840x630.jpg',
        description: 'Elegancja i trwałość dzięki kolekcji Madera.'
    },
];

export function Realizations() {
  return (
    <section className="py-24 bg-gray-50 text-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nasze Realizacje</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Zobacz, jak nasze podłogi prezentują się w rzeczywistych wnętrzach.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {realizations.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="relative h-64 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {item.location}
                            </span>
                        </div>
                        <p className="text-gray-600">{item.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
