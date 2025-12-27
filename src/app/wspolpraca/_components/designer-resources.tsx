'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Headset, Box, FileText } from 'lucide-react';

export function DesignerResources() {
  return (
    <section className="py-24 bg-zinc-900 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            
            <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Strefa Projektanta
                </h2>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                    Wiemy, jak ważna jest Twoja praca. Dlatego przygotowaliśmy komplet materiałów, 
                    które ułatwią Ci projektowanie i prezentację koncepcji klientom.
                </p>
                
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <Box className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Box Próbek</h3>
                            <p className="text-sm text-gray-400">Fizyczne próbki naszych bestsellerów dostarczone do Twojej pracowni.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <Headset className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Wsparcie Eksperta</h3>
                            <p className="text-sm text-gray-400">Bezpośredni kontakt z doradcą technicznym, który pomoże w doborze rozwiązań.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <FileText className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Karty Techniczne</h3>
                            <p className="text-sm text-gray-400">Pełna dokumentacja techniczna, atesty i gwarancje dla Twoich projektów.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:w-1/2 flex justify-center">
                <motion.div 
                    className="bg-linear-to-br from-zinc-800 to-zinc-950 p-8 rounded-2xl border border-white/10 max-w-md w-full text-center"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                >
                    <h3 className="text-2xl font-bold mb-4">Pobierz paczkę startową</h3>
                    <p className="text-gray-400 mb-8 text-sm">
                        Zaloguj się do panelu partnera, aby uzyskać dostęp do wszystkich zasobów cyfrowych.
                    </p>
                    <Button className="w-full bg-white text-black hover:bg-gray-200 py-6 text-lg rounded-xl font-bold">
                        Przejdź do Panelu
                    </Button>
                </motion.div>
            </div>

        </div>
      </div>
    </section>
  );
}
