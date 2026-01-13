export function StoreFooter() {
    return (
      <footer className="border-t bg-muted/30">
        <div className="container py-10 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Oferta</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Podłogi Drewniane</a></li>
                <li><a href="#" className="hover:text-foreground">Wybielane</a></li>
                <li><a href="#" className="hover:text-foreground">Jodełka</a></li>
                <li><a href="#" className="hover:text-foreground">Akcesoria</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Pomoc</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Dostawa i płatność</a></li>
                <li><a href="#" className="hover:text-foreground">Zwroty i reklamacje</a></li>
                <li><a href="#" className="hover:text-foreground">Instrukcja montażu</a></li>
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Firma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">O nas</a></li>
                <li><a href="#" className="hover:text-foreground">Showroom</a></li>
                <li><a href="#" className="hover:text-foreground">Współpraca B2B</a></li>
                <li><a href="#" className="hover:text-foreground">Kontakt</a></li>
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
