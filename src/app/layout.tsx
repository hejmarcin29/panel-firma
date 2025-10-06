import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/navigation/app-shell";
import { requireSession } from "@/lib/auth";
import { isPublicPath } from "@/lib/routes";
import { userRoleLabels } from "@/lib/user-roles";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nowy panel",
  description: "Minimalny start aplikacji – dodaj własne moduły i widoki.",
};

async function resolveCurrentPath(): Promise<string> {
  const headerList = await headers();

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost";
  const candidates = [
    headerList.get("x-invoke-path"),
    headerList.get("x-pathname"),
    headerList.get("x-forwarded-uri"),
    headerList.get("x-original-uri"),
    headerList.get("x-request-uri"),
    headerList.get(":path"),
    headerList.get("next-url"),
    headerList.get("x-url"),
    headerList.get("referer"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.startsWith("/")) {
      const [pathname] = candidate.split("?");
      return pathname || "/";
    }

    try {
      const parsed = new URL(candidate, `http://${host}`);
      if (parsed.pathname) {
        return parsed.pathname;
      }
    } catch (error) {
      void error;
    }
  }

  return "/";
}

function getUserInitials(name?: string | null, username?: string | null) {
  if (name) {
    const [first = "", second = ""] = name.trim().split(/\s+/);
    if (first && second) {
      return `${first[0]}${second[0]}`.toUpperCase();
    }
    if (first) {
      return first.slice(0, 2).toUpperCase();
    }
  }

  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return "U";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentPath = await resolveCurrentPath();
  const isProtectedRoute = !isPublicPath(currentPath);
  const session = isProtectedRoute ? await requireSession() : null;
  const displayName = session?.user.name ?? session?.user.username ?? "Użytkownik";
  const initials = getUserInitials(session?.user.name, session?.user.username);
  const roleLabel = session?.user.role ? userRoleLabels[session.user.role as keyof typeof userRoleLabels] ?? session.user.role : null;

  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}>
        {isProtectedRoute ? (
          <AppShell
            user={{
              displayName,
              role: roleLabel,
              initials,
            }}
          >
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
