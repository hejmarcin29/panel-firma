import Link from "next/link";
import Image from "next/image"; // Added
import { Search, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartButton } from "./cart-button";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions"; // Added

export async function StoreHeader() {
  const config = await getShopConfig();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
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
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/sklep" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Oferta
          </Link>
          <Link href="/sklep?q=promocja" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Promocje
          </Link>
          <Link href="/realizacje" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Realizacje
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Poradnik
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {config.headerShowSearch && (
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">Szukaj</span>
            </Button>
          )}
          {config.headerShowUser && (
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <User className="h-5 w-5" />
              <span className="sr-only">Konto</span>
            </Button>
          )}
          <CartButton />
        </div>
      </div>
    </header>
  );
}
