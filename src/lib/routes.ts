export const LOGIN_ROUTE = "/logowanie";
export const SETUP_ROUTE = "/setup";

export const PUBLIC_PATH_PREFIXES = [LOGIN_ROUTE, SETUP_ROUTE] as const;

const PUBLIC_STATIC_PREFIXES = ["/_next/", "/favicon", "/assets/", "/public/"] as const;
const PUBLIC_STATIC_PATHS = ["/favicon.ico", "/robots.txt", "/sitemap.xml", "/manifest.json"] as const;

export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  if (PUBLIC_STATIC_PATHS.includes(pathname as (typeof PUBLIC_STATIC_PATHS)[number])) {
    return true;
  }

  if (PUBLIC_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
