'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden bg-black text-white">
      {/* Background Image/Video Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/90 z-10" />
        <motion.img 
            src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop" 
            alt="Luxury Interior" 
            className="h-full w-full object-cover opacity-80"
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        />
      </div>

      <div className="relative z-20 container mx-auto h-full flex flex-col justify-center px-4 md:px-8">
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
        >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                Twórz wnętrza. <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-yellow-500">
                    My zajmiemy się resztą.
                </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl font-light">
                Dołącz do strefy architekta. Zyskaj spokój, profesjonalny montaż i transparentne prowizje.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-full transition-all duration-300 hover:scale-105"
                    onClick={() => document.getElementById('register-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Dołącz do Strefy Architekta
                </Button>
                <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full backdrop-blur-sm"
                >
                    Zobacz Realizacje <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </motion.div>
      </div>
    </section>
  );
}
