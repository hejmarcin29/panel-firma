import Link from "next/link";
import Image from "next/image"; // Added
import { Search, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartButton } from "./cart-button";
import { getShopConfig, getBestsellers } from "@/app/dashboard/settings/shop/actions"; // Added
import { VisualCommandCenter } from "./visual-command-center";

export async function StoreHeader() {
  const config = await getShopConfig();
  const bestsellers = await getBestsellers();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-4">
          <VisualCommandCenter 
            turnstileSiteKey={config.turnstileSiteKey} 
            bestsellers={bestsellers.map(p => ({
              ...p,
              id: String(p.id),
              slug: p.slug || ''
            }))} 
          />
          <Link href="/" className="font-playfair text-xl font-bold tracking-tight">
             {config.headerLogo ? (
                <div className="relative h-10 w-32 md:w-40">
                  <Image 
                    src={config.headerLogo} 
                    alt="Logo" 
                    fill 
                    className="object-contain object-left"
                    priority
                  />
                </div>
             ) : (
                "Prime Podłoga"
             )}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link href="/sklep" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Sklep
          </Link>
          <Link href="/kontakt" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Kontakt
          </Link>
           <Link href="/dlaczego-my" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Dlaczego my?
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Blog
          </Link>
           <Button variant="default" size="sm" className="bg-[#c0392b] hover:bg-[#a93226] text-white" asChild>
              <Link href="/kontakt">Chcę montaż</Link>
          </Button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {config.headerShowSearch && (
            <div className="hidden md:flex relative w-64 mr-2">
                 <Button variant="outline" className="w-full justify-start text-muted-foreground bg-muted/20 border-muted-foreground/20 hover:bg-muted/30">
                    <Search className="mr-2 h-4 w-4" />
                    <span className="text-xs">Szukaj produktów...</span>
                 </Button>
            </div>
          )}
          
          <div className="hidden sm:flex items-center gap-4 mr-2 border-r pr-4">
             {config.headerShowUser && (
                <Link href="/login" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Moje konto</span>
                </Link>
              )}
               <Link href="/pomoc" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <span className="h-5 w-5 flex items-center justify-center font-serif italic font-bold">?</span>
                  <span className="text-[10px] font-medium">Pomoc</span>
                </Link>
          </div>

          <CartButton />
        </div>
      </div>
    </header>
  );
}
