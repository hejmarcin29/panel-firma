import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { users } from "@db/schema";

import { db } from "@db";

import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const totalUsersResult = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .limit(1);

  const totalUsers = totalUsersResult[0]?.total ?? 0;
  if (totalUsers > 0) {
    redirect("/logowanie");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-background p-8 shadow-xl shadow-black/5 ring-1 ring-border/40">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Utwórz pierwszego administratora
          </h1>
          <p className="text-sm text-muted-foreground">
            To jednorazowa konfiguracja dostępu. Wprowadź dane osoby, która będzie zarządzać panelem.
          </p>
        </div>
        <div className="mt-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
