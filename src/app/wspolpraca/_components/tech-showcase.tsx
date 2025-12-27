'use client';

import { motion } from 'framer-motion';
import { Laptop, Smartphone } from 'lucide-react';

export function TechShowcase() {
  return (
    <section className="py-24 bg-zinc-950 text-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="lg:w-1/2 space-y-8">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Technologia, która <br/>
                        <span className="text-blue-500">pracuje dla Ciebie.</span>
                    </h2>
                    <p className="text-lg text-gray-400 leading-relaxed">
                        Jako pierwsi w Polsce udostępniamy architektom dedykowany panel B2B. 
                        Śledź postępy prac, sprawdzaj statusy zamówień i kontroluj swoje prowizje w czasie rzeczywistym.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <Laptop className="h-8 w-8 text-blue-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Panel Desktop</h3>
                        <p className="text-sm text-gray-400">Pełna kontrola nad wszystkimi projektami z biura.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <Smartphone className="h-8 w-8 text-purple-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Mobile First</h3>
                        <p className="text-sm text-gray-400">Sprawdzaj statusy w biegu, między spotkaniami.</p>
                    </div>
                </div>
            </div>

            <div className="lg:w-1/2 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10"
                >
                    {/* Mockup Placeholder - In real project use a real screenshot inside a device frame */}
                    <div className="rounded-xl overflow-hidden shadow-2xl border-8 border-gray-800 bg-gray-900 aspect-video relative group">
                        <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 flex items-center px-4 space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="p-8 flex items-center justify-center h-full bg-zinc-900 text-gray-500 flex-col gap-4">
                            <div className="w-full max-w-md space-y-2">
                                <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
                                <div className="h-32 bg-gray-800 rounded w-full animate-pulse"></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-20 bg-gray-800 rounded animate-pulse"></div>
                                    <div className="h-20 bg-gray-800 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-2xl font-bold text-white mb-1">Panel Partnera</p>
                                <p className="text-sm">Widok Twoich projektów</p>
                            </div>
                        </div>
                        
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 -z-10" />
                    </div>
                </motion.div>
                
                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

        </div>
      </div>
    </section>
  );
}
