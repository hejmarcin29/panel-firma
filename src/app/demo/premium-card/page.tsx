import { PremiumProductCard } from "@/components/demo/PremiumProductCard"

export default function DemoPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 selection:bg-amber-500/30">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-amber-900/20 to-transparent opacity-50 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
        
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-500 backdrop-blur-xl">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
            Next.js 15 + Framer Motion Demo
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Poczuj <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Jakość</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed">
            To nie jest zwykła karta produktu. To interaktywne doświadczenie, które buduje zaufanie i pożądanie.
            Najedź kursorem lub dotknij, aby poczuć głębię. Kliknij, aby zobaczyć detale.
          </p>
        </div>
        
        <div className="grid gap-16 lg:grid-cols-1 xl:grid-cols-1" style={{ perspective: "1000px" }}>
          <PremiumProductCard />
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
            {[
                { title: "Fizyka Ruchu", desc: "Karta reaguje na ruch myszy, symulując fizyczny obiekt w przestrzeni 3D." },
                { title: "Płynne Przejścia", desc: "Brak przeładowań strony. Animacje Shared Layout tworzą wrażenie aplikacji natywnej." },
                { title: "Wydajność", desc: "Mimo zaawansowanych efektów, całość działa w 60fps dzięki akceleracji GPU." }
            ].map((item, i) => (
                <div key={i} className="group rounded-2xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">{item.title}</h3>
                    <p className="text-neutral-400">{item.desc}</p>
                </div>
            ))}
        </div>

        <div className="mt-24 flex flex-col items-center gap-4 text-center text-neutral-600 text-sm">
          <p>
            Aby usunąć to demo z projektu, po prostu skasuj foldery:
          </p>
          <code className="rounded bg-neutral-900 px-3 py-1 font-mono text-amber-500/70">
            rm -rf src/app/demo src/components/demo
          </code>
        </div>
      </div>
    </div>
  )
}
