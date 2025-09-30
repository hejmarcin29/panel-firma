"use client";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pl } from "@/i18n/pl";

const schema = z.object({
  email: z.string().email("Podaj poprawny email"),
  password: z.string().min(1, "Hasło jest wymagane"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-2 text-2xl font-semibold">Logowanie</h1>
      <p className="mb-6 text-sm opacity-70">
        Podaj swoje dane, aby zalogować się do panelu.
      </p>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async ({ email, password }) => {
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (!res) {
            setError("password", { type: "manual", message: "Błąd logowania" });
            return;
          }
          if (typeof res === "object" && "error" in res && res.error) {
            setError("password", {
              type: "manual",
              message: "Błędny email lub hasło",
            });
            return;
          }
          if (typeof res === "object" && "ok" in res && !res.ok) {
            setError("password", { type: "manual", message: "Błąd logowania" });
            return;
          }
          if (typeof res === "object" && "url" in res && res.url) {
            // manual redirect to root to avoid relying on callbackUrl w/ redirect: true
            window.location.href = "/";
          }
        })}
      >
        <div className="space-y-2">
          <Label>{pl.clients.email}</Label>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Hasło</Label>
          <Input type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked {...register("remember")} />
          <span>Zapamiętaj to urządzenie</span>
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {pl.nav.login}
        </Button>
      </form>
    </div>
  );
}
