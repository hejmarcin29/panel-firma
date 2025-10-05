"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

const LOGIN_ROUTE = "/logowanie";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Nie udało się wylogować. Spróbuj ponownie.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        router.replace(LOGIN_ROUTE);
        router.refresh();
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="mr-2 size-4" aria-hidden />
      )}
      Wyloguj
    </Button>
  );
}
