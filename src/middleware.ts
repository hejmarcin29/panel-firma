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
    // Jeśli jesteśmy w domenie sklepu, ale ścieżka nie zaczyna się od (storefront),
    // to przepisujemy URL na grupę (storefront)
    // Ale w Next.js Route Groups są "przezroczyste" w URLu, chyba że robimy rewrite.
    // Tutaj chcemy, żeby "/" w domenie sklepu wskazywało na "src/app/(storefront)/page.tsx"
    
    // Jeśli to główna strona sklepu
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/(storefront)', request.url));
    }

    // Jeśli to inna podstrona sklepu, np. /koszyk -> przepisujemy na /(storefront)/koszyk
    // Warunek: nie chcemy przepisywać jeśli już tam jest (chociaż rewrite tego nie pokaże w URL)
    return NextResponse.rewrite(new URL(`/(storefront)${url.pathname}`, request.url));
  }

  // Routing dla panelu (b2b.primepodloga.pl lub inna domena)
  // Nic nie zmieniamy, działa standardowo (src/app/page.tsx, src/app/dashboard/...)
  // Możemy opcjonalnie wymusić przekierowanie z "/" na "/dashboard" lub "/login" jeśli to panel
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
