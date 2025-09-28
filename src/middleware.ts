import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware that protects app routes by redirecting unauthenticated users to /login
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals and static files
  const isInternal =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  // Always skip middleware for API routes. API auth/autz odbywa się w samych handlerach.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public paths that should not require auth
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/setup" ||
    pathname.startsWith("/setup/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup");

  if (isInternal || isPublic) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    // Optionally, pass the original path to redirect after login
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware to all routes except the listed ones (negative lookahead)
export const config = {
  matcher: [
    // Wyklucz wszystkie ścieżki /api/** – middleware stosujemy wyłącznie do stron aplikacji
    "/((?!api|login|setup|_next/static|_next/image|favicon.ico|assets|images|public).*)",
  ],
};
