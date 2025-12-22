"use client"

import React, { useRef, useState } from "react"
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"
import { ArrowRight, Maximize2, Ruler, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ROTATION_RANGE = 25

const VARIANTS = [
  {
    id: "dark",
    name: "Dark Oak",
    color: "#3E2723",
    image: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=1000&auto=format&fit=crop",
    price: "189,00"
  },
  {
    id: "light",
    name: "Nordic Ash",
    color: "#D7CCC8",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1000&auto=format&fit=crop",
    price: "179,00"
  },
  {
    id: "warm",
    name: "Warm Walnut",
    color: "#8D6E63",
    image: "https://images.unsplash.com/photo-1543459176-4426b363e15c?q=80&w=1000&auto=format&fit=crop",
    price: "199,00"
  }
]

export function PremiumProductCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeVariant, setActiveVariant] = useState(VARIANTS[0])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const xSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 })

  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`
  
  // Glare effect opacity based on mouse position
  const glareOpacity = useTransform(
    mouseY,
    [0, 500],
    [0.4, 0]
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isExpanded) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    const rX = (clientY / height - 0.5) * -ROTATION_RANGE
    const rY = (clientX / width - 0.5) * ROTATION_RANGE

    x.set(rX)
    y.set(rY)
    mouseX.set(clientX)
    mouseY.set(clientY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: isExpanded ? "none" : transform,
          zIndex: isExpanded ? 50 : 1,
        }}
        className={cn(
          "relative h-[550px] w-full max-w-[380px] cursor-pointer rounded-2xl transition-all duration-500",
          isExpanded ? "fixed inset-0 z-50 h-full w-full max-w-none rounded-none" : ""
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
        layoutId="product-card-container"
      >
        <div
          style={{
            transform: isExpanded ? "none" : "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
          className={cn(
            "absolute inset-0 grid place-content-center overflow-hidden bg-neutral-900 shadow-2xl",
            isExpanded ? "rounded-none" : "rounded-2xl"
          )}
        >
          {/* Background Texture Image */}
          <motion.div 
            className="absolute inset-0 h-full w-full"
            layoutId="product-image"
          >
             <div className="absolute inset-0 bg-black/40 z-10" />
             <AnimatePresence mode="wait">
                <motion.img 
                    key={activeVariant.id}
                    src={activeVariant.image}
                    alt={activeVariant.name}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 h-full w-full object-cover"
                />
             </AnimatePresence>
          </motion.div>

          {/* Glare Effect (Only in card mode) */}
          {!isExpanded && (
            <motion.div
                className="absolute inset-0 z-20 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 pointer-events-none mix-blend-overlay"
                style={{
                    opacity: isHovered ? glareOpacity : 0,
                    background: useMotionTemplate`radial-gradient(
                        600px circle at ${mouseX}px ${mouseY}px,
                        rgba(255,255,255,0.15),
                        transparent 80%
                    )`
                }}
            />
          )}

          {/* Content */}
          <div className={cn(
              "relative z-30 flex h-full flex-col justify-end p-8 transition-all duration-500",
              isExpanded ? "max-w-7xl mx-auto w-full pb-24" : ""
          )}>
            <motion.div
                layoutId="product-content"
                className="flex flex-col gap-4"
            >
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 backdrop-blur-md ring-1 ring-inset ring-amber-500/30">
                        Premium Collection
                    </span>
                    {isExpanded && (
                        <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md"
                        >
                            Dostępne od ręki
                        </motion.span>
                    )}
                </div>
                
                <div>
                    <motion.h3 
                        layoutId="product-title"
                        className={cn("font-bold text-white leading-tight", isExpanded ? "text-6xl md:text-8xl" : "text-4xl")}
                    >
                        {activeVariant.name}
                    </motion.h3>
                    <motion.p 
                        layoutId="product-desc"
                        className={cn("mt-4 text-neutral-300 font-light", isExpanded ? "text-xl max-w-2xl" : "text-sm")}
                    >
                        Naturalny dąb o głębokiej strukturze synchronicznej. 
                        Idealny do wnętrz w stylu skandynawskim i japandi.
                        {isExpanded && " Wyjątkowa trwałość dzięki technologii SPC i zintegrowany podkład akustyczny zapewniają komfort użytkowania na lata."}
                    </motion.p>
                </div>

                {/* Color Variants Selector */}
                <div className="mt-6 flex gap-3" onClick={(e) => e.stopPropagation()}>
                    {VARIANTS.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => setActiveVariant(variant)}
                            className={cn(
                                "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                                activeVariant.id === variant.id 
                                    ? "border-white scale-110 ring-2 ring-white/20 ring-offset-2 ring-offset-black" 
                                    : "border-transparent opacity-70 hover:opacity-100"
                            )}
                            style={{ backgroundColor: variant.color }}
                            title={variant.name}
                        />
                    ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-6">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-neutral-400">Cena katalogowa</span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn("font-bold text-white", isExpanded ? "text-4xl" : "text-2xl")}>{activeVariant.price}</span>
                            <span className="text-sm text-neutral-400">zł / m²</span>
                        </div>
                    </div>
                    
                    {!isExpanded ? (
                        <Button size="icon" className="h-12 w-12 rounded-full bg-white text-black hover:bg-neutral-200 hover:scale-105 transition-all">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    ) : (
                        <div className="flex gap-4">
                             <Button size="lg" className="rounded-full bg-white px-8 text-black hover:bg-neutral-200">
                                Zamów próbkę
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md">
                                Pobierz kartę techniczną
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Expanded Content Details */}
            {isExpanded && (
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-12"
                >
                    {[
                        { label: "Klasa ścieralności", value: "AC5 / 33" },
                        { label: "Wymiar deski", value: "600 x 120 mm" },
                        { label: "Ogrzewanie podłogowe", value: "Tak, do 27°C" },
                        { label: "Gwarancja", value: "25 lat (domowa)" },
                        { label: "Wodoodporność", value: "100% Waterproof" },
                        { label: "Montaż", value: "Click System 5G" },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500 uppercase tracking-wider">{item.label}</span>
                            <span className="text-xl font-medium text-white">{item.value}</span>
                        </div>
                    ))}
                </motion.div>
            )}
          </div>

          {/* Floating Elements */}
          {!isExpanded && (
            <>
                <motion.div 
                    className="absolute right-6 top-6 rounded-full bg-black/40 p-3 text-white backdrop-blur-md border border-white/10"
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                    <Maximize2 className="h-5 w-5" />
                </motion.div>

                <div className="absolute -left-16 top-1/3 flex -rotate-90 items-center gap-3 text-xs font-medium text-neutral-400 tracking-widest uppercase">
                    <Ruler className="h-3 w-3" />
                    <span>600 x 120 mm</span>
                </div>
            </>
          )}

          {/* Close Button for Expanded View */}
          {isExpanded && (
            <motion.button
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(false)
                }}
                className="absolute top-8 right-8 z-50 rounded-full bg-black/50 p-4 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
            >
                <X className="h-6 w-6" />
            </motion.button>
          )}
        </div>
      </motion.div>
      
      {/* Overlay for expanded state to hide other content */}
      <AnimatePresence>
        {isExpanded && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm"
            />
        )}
      </AnimatePresence>
    </>
  )
}
