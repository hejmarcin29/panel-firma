'use client';

import { motion } from 'framer-motion';

const products = [
    { id: 1, name: 'Dąb Naturalny', type: 'Winyl', image: 'https://images.unsplash.com/photo-1581858726768-7589d36dc976?q=80&w=1000&auto=format&fit=crop', size: 'large' },
    { id: 2, name: 'Beton Architektoniczny', type: 'Winyl', image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=1000&auto=format&fit=crop', size: 'small' },
    { id: 3, name: 'Jodełka Klasyczna', type: 'Drewno', image: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?q=80&w=1000&auto=format&fit=crop', size: 'small' },
    { id: 4, name: 'Marmur Carrara', type: 'Spiek', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop', size: 'large' },
    { id: 5, name: 'Orzech Amerykański', type: 'Winyl', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop', size: 'small' },
];

export function ProductGallery() {
  return (
    <section className="py-24 bg-white text-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Wyselekcjonowane Kolekcje</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Najlepsze winyle, jodełka, beton – mamy to, czego szukają Twoi klienci.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px]">
            {products.map((product, index) => (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative group overflow-hidden rounded-2xl cursor-pointer ${product.size === 'large' ? 'md:col-span-2' : ''}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                    
                    <div className="absolute bottom-0 left-0 p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-sm font-medium text-white/80 mb-1">{product.type}</p>
                        <h3 className="text-2xl font-bold">{product.name}</h3>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
