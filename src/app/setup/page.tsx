import Link from "next/link";
import { redirect } from "next/navigation";

import { hasAdminUser, getCurrentSession, LOGIN_ROUTE } from "@/lib/auth";

import { SetupForm } from "./setup-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Konfiguracja panelu",
  description: "Utwórz pierwsze konto administratora dla panelu zarządzania firmą.",
};

export default async function SetupPage() {
  const adminExists = await hasAdminUser();

  if (adminExists) {
    const session = await getCurrentSession();
    if (session) {
      redirect("/zlecenia");
    }

    return (
      <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.1),_transparent_45%)]" />
        <section className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary">
              Panel już skonfigurowany
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Nie można utworzyć kolejnego administratora
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              W systemie istnieje już konto administratora. Zaloguj się korzystając z formularza logowania, aby kontynuować pracę z panelem.
            </p>
          </div>
          <Button asChild className="rounded-full px-6 py-2 font-semibold">
            <Link href={LOGIN_ROUTE}>Przejdź do logowania</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.1),_transparent_45%)]" />
      <section className="flex w-full max-w-6xl flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            Pierwsze uruchomienie
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Skonfiguruj panel zarządzania firmą
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Nie znaleziono konta administratora. Utwórz je teraz, aby zarządzać sprzedażą, montażami i partnerami w jednym miejscu.
          </p>
        </div>

        <SetupForm className="mt-4" />

        <div className="grid gap-2 text-xs text-muted-foreground sm:text-sm">
          <p>
            Po utworzeniu konta zostaniesz automatycznie zalogowany i przeniesiony do pulpitu zleceń.
          </p>
          <p>
            Możesz później dodać kolejnych użytkowników (monterów, partnerów) bezpośrednio z panelu administracyjnego.
          </p>
        </div>
      </section>
    </main>
  );
}
