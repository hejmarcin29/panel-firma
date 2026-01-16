/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Instagram, Banknote } from "lucide-react";

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
                <h4 className="text-sm font-semibold">Dane Firmy</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Primepodloga.pl</p>
                  <p>ul. Koszalińska 38A</p>
                  <p>47-400 Racibórz</p>
                  <p>NIP: 6392026404</p>
                </div>
                
                <h4 className="text-sm font-semibold mt-6">Bezpieczne Płatności</h4>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                     {/* Przelew Tradycyjny */}
                     <div className="bg-white p-1 rounded border h-8 px-2 flex items-center justify-center gap-2 text-slate-800" title="Przelew Tradycyjny">
                        <Banknote className="h-4 w-4" />
                        <span className="text-[10px] font-bold leading-none">PRZELEW</span>
                    </div>
                    {/* Tpay */}
                    <div className="bg-white p-1 rounded border h-8 w-12 flex items-center justify-center" title="Tpay">
                       <img src="/payments/tpay.svg" alt="Tpay" className="h-full w-full object-contain" />
                    </div>
                    {/* BLIK */}
                    <div className="bg-white p-1 rounded border h-8 w-12 flex items-center justify-center" title="BLIK">
                        <img src="/payments/blik.svg" alt="BLIK" className="h-full w-full object-contain" />
                    </div>
                    {/* Visa */}
                    <div className="bg-white p-1 rounded border h-8 w-12 flex items-center justify-center" title="Visa">
                        <img src="/payments/visa.svg" alt="Visa" className="h-full w-full object-contain" />
                    </div>
                    {/* Mastercard */}
                    <div className="bg-white p-1 rounded border h-8 w-12 flex items-center justify-center" title="Mastercard">
                         <img src="/payments/mastercard.svg" alt="Mastercard" className="h-full w-full object-contain" />
                    </div>
                    {/* GPay */}
                    <div className="bg-white p-1 rounded border h-8 w-12 flex items-center justify-center" title="Google Pay">
                        <img src="/payments/googlepay.svg" alt="Google Pay" className="h-full w-full object-contain" />
                    </div>
                     {/* Apple Pay */}
                     <div className="bg-white p-1 rounded border h-8 w-12 flex items-center justify-center" title="Apple Pay">
                        <img src="/payments/applepay.svg" alt="Apple Pay" className="h-full w-full object-contain" />
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <a href="https://www.instagram.com/primepodloga/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="sr-only">Instagram</span>
                    </a>
                </div>

                <div className="text-xs text-muted-foreground pt-4">
                    &copy; {new Date().getFullYear()} Prime Podłoga. Wszelkie prawa zastrzeżone.
                </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
