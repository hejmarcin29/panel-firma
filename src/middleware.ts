import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Sprawdź czy to domena sklepu (test.primepodloga.pl lub primepodloga.pl)
  // W środowisku lokalnym możesz testować np. mapując w hosts domenę test.localhost
  const isStoreDomain = 
    hostname.includes('test.primepodloga.pl') || 
    hostname.includes('primepodloga.pl') ||
    hostname.startsWith('test.');

  // Ignore static files, api, _next
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.') // file extension
  ) {
    return NextResponse.next();
  }

  // Routing dla sklepu
  if (isStoreDomain) {
    
    // Główna strona sklepu (test.primepodloga.pl/) -> /witryna
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/witryna', request.url));
    }

    // Pozostałe podstrony (np. /produkt/slug) - sprawdź czy plik istnieje w (storefront)?
    // Nie musimy sprawdzać. Next.js sam dopasuje np. /produkt/xyz do (storefront)/produkt/xyz
    // Ale upewnijmy się, że nie próbujemy wejść do /dashboard
    if (url.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/', request.url)); // Wyrzuć ze sklepu na główną (czyli witrynę)
    }

    // Ważne: Żeby /witryna działała przezroczyle, musimy pozwolić na standardowe dopasowanie
    // Next.js automatycznie szuka w (storefront) bo to Root Layout group.
    
    return NextResponse.next();
  }

  // Routing dla panelu (b2b.primepodloga.pl lub inna domena)
  // Nic nie zmieniamy, działa standardowo (src/app/page.tsx, src/app/dashboard/...)
  // Możemy opcjonalnie wymusić przekierowanie z "/" na "/dashboard" lub "/login" jeśli to panel
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
