'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function TechShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="py-32 bg-gray-900 text-white overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div style={{ y, opacity }}>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Technologia,<br />
              która <span className="text-emerald-400">zarabia</span><br />
              dla Ciebie.
            </h2>
            <div className="space-y-8 text-lg text-gray-300">
              <p>
                Nie jesteśmy zwykłym sklepem. Jesteśmy firmą technologiczną.
                Nasz autorski system CRM automatyzuje proces obsługi klienta,
                dzięki czemu Ty masz pewność, że żaden lead nie przepadnie.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Podgląd statusu każdego klienta online 24/7</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Automatyczne powiadomienia o wypłacie prowizji</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Dedykowany opiekun B2B dla Twojej firmy</span>
                </li>
              </ul>
            </div>
          </motion.div>

          <div className="relative h-[600px] w-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-950/50 backdrop-blur-sm">
             {/* Abstract UI Representation */}
             <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-blue-500/10" />
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="h-2 w-20 bg-gray-800 rounded-full" />
                </div>
                
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                                {i}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-2 w-24 bg-gray-700 rounded-full" />
                                <div className="h-2 w-16 bg-gray-800 rounded-full" />
                            </div>
                            <div className="h-6 w-16 bg-emerald-500/20 rounded text-emerald-400 text-xs flex items-center justify-center">
                                Opłacone
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Prowizja do wypłaty:</span>
                        <span className="text-xl font-bold text-emerald-400">4 250 PLN</span>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
