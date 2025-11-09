"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { setupAction, type SetupState } from "./actions";

const initialState: SetupState | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full rounded-2xl" disabled={pending}>
      {pending ? "Zakładanie konta..." : "Utwórz konto administratora"}
    </Button>
  );
}

export function SetupForm() {
  const [state, formAction] = useActionState(setupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Imię i nazwisko</Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="Anna Kowalska"
          className="rounded-2xl"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail służbowy</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@twojafirma.pl"
          className="rounded-2xl"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="rounded-2xl"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Powtórz hasło</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="rounded-2xl"
        />
      </div>
      {state?.error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        Masz już konto? <Link href="/logowanie" className="text-primary underline underline-offset-2">Zaloguj się</Link>.
      </p>
    </form>
  );
}
