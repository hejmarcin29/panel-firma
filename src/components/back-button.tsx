"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref }: { fallbackHref?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else if (fallbackHref) router.push(fallbackHref);
        else router.push("/");
      }}
      className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
    >
      <ArrowLeft className="h-4 w-4" />
      Wstecz
    </button>
  );
}
