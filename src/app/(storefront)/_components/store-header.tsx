import Link from "next/link";
import { ShoppingCart, Search, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreHeader() {
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
            Prime Podłoga
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/kolekcje" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Kolekcje
          </Link>
          <Link href="/promocje" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Promocje
          </Link>
          <Link href="/inspiracje" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Inspiracje
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Poradnik
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Szukaj</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <User className="h-5 w-5" />
            <span className="sr-only">Konto</span>
          </Button>
          <Link href="/koszyk">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Koszyk</span>
              {/* Badge placeholder */}
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                0
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
