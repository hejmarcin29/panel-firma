import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // --- KONFIGURACJA DOMEN ---
  // Tu wpisujemy sztywne adresy. Żadnego zgadywania.
  const DOMAIN_PANEL = 'b2b.primepodloga.pl';
  const DOMAIN_SKLEP_TEST = 'test.primepodloga.pl';
  // Opcjonalnie docelowa domena sklepu w przyszłości:
  const DOMAIN_SKLEP_PROD = 'primepodloga.pl'; 

  // Ignoruj pliki systemowe Next.js, API, obrazki
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- LOGIKA DLA PANELU (b2b) ---
  if (hostname === DOMAIN_PANEL) {
    // Panel działa "po bożemu" - korzysta z głównego routingu aplikacji
    // src/app/page.tsx przekieruje na /login lub /dashboard
    return NextResponse.next();
  }

  // --- LOGIKA DLA SKLEPU (test lub prod) ---
  if (hostname === DOMAIN_SKLEP_TEST || hostname === DOMAIN_SKLEP_PROD) {
    
    // 1. OCHRONA: Nie pozwalaj wejść do panelu B2B z adresu sklepu
    if (url.pathname.startsWith('/dashboard') || 
        url.pathname.startsWith('/login') || 
        url.pathname.startsWith('/settings')) {
       // Wyrzuć z powrotem na stronę główną sklepu
       return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. STRONA GŁÓWNA: Przepisz "/" na "/witryna"
    // (Bo fizyczny plik "/" jest zajęty przez panel B2B)
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/witryna', request.url));
    }

    // 3. POZOSTAŁE PODSTRONY SKLEPU
    // np. /produkt/xyz, /koszyk, /kolekcje - działają normalnie
    return NextResponse.next();
  }

  // --- LOCALHOST (Development) ---
  // Dla localhosta domyślne zachowanie (czyli odpala się Panel B2B)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
