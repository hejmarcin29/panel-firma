"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { pl } from "@/i18n/pl";

export function Topbar() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <header className="w-full border-b border-black/10 dark:border-white/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-medium hover:opacity-90">{pl.nav.dashboard}</Link>
          <Link href="/klienci" className="opacity-80 hover:opacity-100">{pl.nav.clients}</Link>
        </nav>
        <nav className="flex items-center gap-3 text-sm">
          {isAuthed ? (
            <>
              <span className="opacity-70">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                {pl.nav.logout}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              {pl.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
