import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session';

// Publiczne ścieżki dostępne bez logowania
const PUBLIC_PATHS = ['/logowanie', '/setup'];

// Publiczne prefiksy (Next.js, statyczne pliki)
const PUBLIC_PREFIXES = ['/_next/', '/api/auth/'];

// Publiczne pliki
const PUBLIC_FILES = ['/favicon.ico', '/robots.txt', '/sitemap.xml', '/manifest.json'];

function isPublicPath(pathname: string): boolean {
  // Sprawdź dokładne ścieżki
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  // Sprawdź czy ścieżka zaczyna się od publicznego prefixu
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  // Sprawdź publiczne pliki
  if (PUBLIC_FILES.includes(pathname)) {
    return true;
  }

  // Sprawdź czy ścieżka jest podścieżką publicznej ścieżki
  if (PUBLIC_PATHS.some(path => pathname.startsWith(`${path}/`))) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Jeśli ścieżka jest publiczna, pozwól na dostęp
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Jeśli brak sesji i ścieżka jest chroniona, przekieruj na /logowanie
  if (!sessionCookie) {
    const loginUrl = new URL('/logowanie', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Użytkownik ma sesję, pozwól na dostęp
  return NextResponse.next();
}

// Konfiguracja - dopasuj do wszystkich ścieżek oprócz statycznych zasobów Next.js
export const config = {
  matcher: [
    /*
     * Dopasuj wszystkie ścieżki oprócz:
     * - _next/static (pliki statyczne)
     * - _next/image (optymalizacja obrazów)
     * - favicon.ico (ikona)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
