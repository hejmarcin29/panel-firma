"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full rounded-2xl" disabled={pending}>
      {pending ? "Logowanie..." : "Zaloguj się"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="anna@firma.pl"
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
          autoComplete="current-password"
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
        Brak konta? Pierwszego administratora utworzysz wkrótce na stronie setup.
      </p>
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="text-primary underline underline-offset-2">
          Wróć do strony głównej
        </Link>
      </p>
    </form>
  );
}
