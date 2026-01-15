import Link from "next/link";

export function StoreFooter() {
    return (
      <footer className="border-t bg-muted/30">
        <div className="container py-10 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Oferta</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/sklep" className="hover:text-foreground">Wszystkie Podłogi</Link></li>
                <li><Link href="/sklep?pattern=herringbone" className="hover:text-foreground">Jodełka</Link></li>
                <li><Link href="/sklep?color=natural" className="hover:text-foreground">Dąb Naturalny</Link></li>
                <li><Link href="/kolekcje" className="hover:text-foreground">Kolekcje</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Pomoc</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/regulamin" className="hover:text-foreground">Regulamin sklepu</Link></li>
                <li><Link href="/polityka-prywatnosci" className="hover:text-foreground">Polityka prywatności</Link></li>
                <li><Link href="/kontakt" className="hover:text-foreground">Dostawa i płatność</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Poradnik</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Firma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/o-nas" className="hover:text-foreground">O nas</Link></li>
                <li><Link href="/kontakt" className="hover:text-foreground">Kontakt</Link></li>
                <li><Link href="/kontakt" className="hover:text-foreground">Showroom</Link></li>
                <li><Link href="/kontakt" className="hover:text-foreground">Współpraca B2B</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1 space-y-4">
                <h4 className="text-sm font-semibold">Prime Podłoga</h4>
                <p className="text-sm text-muted-foreground">
                  Tworzymy podłogi z pasją od 2010 roku. Jakość, która przetrwa pokolenia.
                </p>
                <div className="text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Prime Podłoga. Wszelkie prawa zastrzeżone.
                </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
