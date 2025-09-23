"use client";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref }: { fallbackHref?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else if (fallbackHref) router.push(fallbackHref);
        else router.push("/");
      }}
      className="rounded border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
    >
      ← Wstecz
    </button>
  );
}
