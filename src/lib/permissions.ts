import type { UserRole } from "@/lib/user-roles";

/**
 * Definicja uprawnień dostępu do tras dla różnych ról użytkowników
 */

// Wzorce ścieżek dostępnych dla każdej roli
const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: ["*"], // Administrator ma dostęp do wszystkiego
  
  MONTER: [
    "/zlecenia",
    "/zlecenia/[orderId]", // tylko swoje zlecenia (weryfikacja w page.tsx)
    "/montaze",
    "/montaze/[installationId]", // tylko swoje montaże
    "/pomiary",
    "/pomiary/nowy", // może tworzyć nowe pomiary
    "/pomiary/[measurementId]",
    "/dostawy-pod-montaz", // tylko dostawy związane z jego montażami
    "/pliki", // tylko pliki ze swoich zleceń
  ],
  
  PARTNER: [
    "/zlecenia", // tylko zlecenia z jego portfela
    "/zlecenia/[orderId]",
    "/klienci", // tylko jego klienci
    "/klienci/[clientId]",
  ],
};

/**
 * Sprawdza czy dana rola ma dostęp do określonej ścieżki
 */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  const permissions = rolePermissions[role];

  // Admin ma dostęp do wszystkiego
  if (permissions.includes("*")) {
    return true;
  }

  // Sprawdź dokładne dopasowanie
  if (permissions.includes(pathname)) {
    return true;
  }

  // Sprawdź czy pathname zaczyna się od dozwolonej ścieżki
  // np. "/zlecenia/123" pasuje do "/zlecenia"
  const hasMatchingPrefix = permissions.some((allowedPath) => {
    // Usuń dynamiczne segmenty [param] dla porównania prefiksów
    const baseAllowedPath = allowedPath.replace(/\/\[.*?\]/g, "");
    return pathname.startsWith(`${baseAllowedPath}/`) || pathname === baseAllowedPath;
  });

  if (hasMatchingPrefix) {
    return true;
  }

  // Sprawdź dopasowanie z dynamicznymi segmentami
  // np. "/zlecenia/abc-123" pasuje do "/zlecenia/[orderId]"
  const hasMatchingPattern = permissions.some((allowedPath) => {
    if (!allowedPath.includes("[")) {
      return false;
    }

    const pattern = allowedPath.replace(/\[.*?\]/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });

  return hasMatchingPattern;
}

/**
 * Sprawdza czy rola może wykonać określoną akcję
 */
export function canPerformAction(
  role: UserRole,
  action: "create" | "edit" | "delete" | "view",
  resource: "orders" | "measurements" | "installations" | "clients" | "users" | "settings"
): boolean {
  // Admin może wszystko
  if (role === "ADMIN") {
    return true;
  }

  // Monter
  if (role === "MONTER") {
    if (resource === "measurements" && action === "create") {
      return true; // może tworzyć pomiary
    }
    if (["measurements", "installations"].includes(resource) && ["view", "edit"].includes(action)) {
      return true; // może przeglądać i edytować swoje pomiary i montaże
    }
    if (resource === "orders" && action === "view") {
      return true; // może przeglądać swoje zlecenia
    }
    return false;
  }

  // Partner
  if (role === "PARTNER") {
    if (["orders", "clients"].includes(resource) && action === "view") {
      return true; // może przeglądać swoje zlecenia i klientów
    }
    return false;
  }

  return false;
}

/**
 * Lista ścieżek wymagających roli ADMIN
 */
export const ADMIN_ONLY_PATHS = [
  "/uzytkownicy",
  "/partnerzy",
  "/produkty",
  "/ustawienia",
  "/logi",
  "/dostawy", // ogólne dostawy (nie pod montaż)
] as const;

/**
 * Sprawdza czy ścieżka wymaga roli ADMIN
 */
export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (adminPath) => pathname === adminPath || pathname.startsWith(`${adminPath}/`)
  );
}
