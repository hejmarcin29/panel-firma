"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Optional: Hide on the main dashboard page if it feels redundant
  if (pathname === '/dashboard') {
      return null;
  }

  return (
    <Button 
        variant="ghost" 
        size="sm" 
        className="gap-1 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
    >
      <ChevronLeft className="h-4 w-4" />
      Wstecz
    </Button>
  );
}
