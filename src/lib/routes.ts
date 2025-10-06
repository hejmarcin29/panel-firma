export const LOGIN_ROUTE = "/logowanie";
export const SETUP_ROUTE = "/setup";

export const PUBLIC_PATH_PREFIXES = [LOGIN_ROUTE, SETUP_ROUTE] as const;

export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
