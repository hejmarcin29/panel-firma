"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  Star, 
  Truck, 
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const PRODUCT = {
  name: "Dąb Naturalny - Kolekcja Premium",
  partner: "Studio Podłóg 'Wnętrze'",
  priceRegular: 189.00,
  pricePromo: 129.00,
  currency: "zł",
  unit: "m²",
  rating: 4.9,
  reviews: 128,
  features: [
    { icon: Droplets, title: "Wodoodporne 24h", desc: "Technologia AquaStop" },
    { icon: ShieldCheck, title: "25 lat gwarancji", desc: "Klasa ścieralności AC5" },
    { icon: Flame, title: "Na ogrzewanie", desc: "Idealne przewodnictwo" },
    { icon: Truck, title: "Szybka dostawa", desc: "Wysyłka w 24h" },
  ]
};

export default function DemoPage() {
  const [scrolled, setScrolled] = useState(false);
  const [quantity, setQuantity] = useState<number | "">("");

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalPrice = quantity ? (Number(quantity) * PRODUCT.pricePromo).toFixed(2) : "0.00";
  const savings = quantity ? (Number(quantity) * (PRODUCT.priceRegular - PRODUCT.pricePromo)).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-32 selection:bg-black selection:text-white">
      
      {/* --- Sticky Header --- */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3 flex items-center justify-between",
          scrolled ? "bg-white/80 backdrop-blur-md border-b border-neutral-200/50 shadow-sm" : "bg-transparent"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">
            PP
          </div>
          <span className={cn("font-semibold text-sm tracking-tight", scrolled ? "text-black" : "text-white drop-shadow-md")}>
            PrimePodłoga
          </span>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider",
          scrolled ? "bg-neutral-100 text-neutral-600" : "bg-white/20 backdrop-blur-md text-white border border-white/30"
        )}>
          <MapPin className="w-3 h-3" />
          {PRODUCT.partner}
        </div>
      </header>

      {/* --- Hero Section --- */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900">
          {/* Placeholder for Product Image */}
          <Image 
            src="https://images.unsplash.com/photo-1581858726768-758a03093171?q=80&w=2070&auto=format&fit=crop" 
            alt="Podłoga Dąb Naturalny"
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40" />
        </div>

        {/* Floating Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-24 right-4 bg-white/90 backdrop-blur text-black px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold z-10"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Oferta z QR kodu
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs text-neutral-300 font-medium">({PRODUCT.reviews} opinii)</span>
            </div>
            
            <h1 className="text-3xl font-bold leading-tight mb-2 tracking-tight">
              {PRODUCT.name}
            </h1>
            <p className="text-neutral-300 text-sm max-w-[80%]">
              Elegancja naturalnego drewna połączona z wytrzymałością nowoczesnej technologii.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- The Deal Section --- */}
      <section className="px-6 py-8 -mt-4 relative z-20 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-end justify-between mb-8 border-b border-neutral-100 pb-6">
          <div>
            <p className="text-neutral-400 text-sm line-through font-medium mb-1">
              Cena regularna: {PRODUCT.priceRegular.toFixed(2)} {PRODUCT.currency}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-neutral-900 tracking-tight">
                {PRODUCT.pricePromo.toFixed(0)}
                <span className="text-2xl">,00</span>
              </span>
              <span className="text-xl font-medium text-neutral-500">
                {PRODUCT.currency} / {PRODUCT.unit}
              </span>
            </div>
          </div>
          <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 animate-pulse">
            -32%
          </div>
        </div>

        {/* --- Bento Grid Features --- */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {PRODUCT.features.map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex flex-col items-start gap-2 hover:bg-neutral-100 transition-colors"
            >
              <div className="p-2 bg-white rounded-xl shadow-sm text-black">
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">{feature.title}</h3>
                <p className="text-[10px] text-neutral-500 leading-tight mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* --- Description Snippet --- */}
        <div className="prose prose-sm prose-neutral mb-8">
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Dlaczego ta podłoga?</h3>
          <p className="text-neutral-600 leading-relaxed">
            To nie jest zwykły panel. To podłoga klasy premium, która wytrzyma zalanie wodą, pazury psa i dziecięce zabawy. 
            Dzięki strukturze synchronicznej 3D, w dotyku jest nie do odróżnienia od prawdziwej deski.
          </p>
        </div>

        {/* --- Order Form --- */}
        <div id="order-form" className="bg-neutral-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-green-400 rounded-full" />
            <h2 className="text-xl font-bold">Szybkie Zamówienie</h2>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium ml-1">Ilość m²</label>
                <div className="relative">
                  <input 
                    type="number" 
                    inputMode="decimal"
                    placeholder="50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">m²</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-center border border-white/5">
                <span className="text-xs text-neutral-400">Razem do zapłaty</span>
                <span className="text-xl font-bold text-green-400">{totalPrice} zł</span>
              </div>
            </div>

            {quantity && Number(quantity) > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-green-400/80 text-center font-medium bg-green-400/10 py-2 rounded-lg"
              >
                Oszczędzasz dzisiaj: {savings} zł!
              </motion.div>
            )}

            <div className="space-y-3 pt-2">
              <input 
                type="text" 
                placeholder="Imię i Nazwisko"
                className="w-full bg-transparent border-b border-white/20 px-2 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-400 transition-colors"
              />
              <input 
                type="tel" 
                placeholder="Numer telefonu"
                className="w-full bg-transparent border-b border-white/20 px-2 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- Sticky Bottom Bar --- */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40"
        >
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <p className="text-xs text-neutral-500 font-medium">Suma ({quantity || 0} m²)</p>
              <p className="text-xl font-bold text-neutral-900">{totalPrice} zł</p>
            </div>
            <button 
              onClick={() => {
                const form = document.getElementById('order-form');
                form?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-[2] bg-black text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/20 active:scale-95 transition-transform"
            >
              Zamawiam z rabatem
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
