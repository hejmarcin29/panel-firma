"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optional: Hide on the main dashboard page if it feels redundant
  if (pathname === '/dashboard') {
      return null;
  }

  const getBackPath = () => {
    // If we are in a tab view (e.g. montage details tabs), go back to the main details view
    if (searchParams.get('tab') && pathname?.startsWith('/dashboard/crm/montaze/')) {
        return pathname;
    }

    if (pathname?.startsWith('/dashboard/orders/')) return '/dashboard/orders';
    if (pathname?.startsWith('/dashboard/crm/montaze/')) return '/dashboard/crm/montaze';
    if (pathname?.startsWith('/dashboard/crm/customers/')) return '/dashboard/crm/customers';
    if (pathname?.startsWith('/dashboard/crm/oferty/')) return '/dashboard/crm/oferty';
    if (pathname?.startsWith('/dashboard/mail/')) return '/dashboard/mail';
    if (pathname?.startsWith('/dashboard/settings/')) return '/dashboard/settings';
    return null;
  };

  const backPath = getBackPath();

  if (backPath) {
    return (
      <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 text-muted-foreground hover:text-foreground"
          asChild
      >
        <Link href={backPath}>
          <ChevronLeft className="h-4 w-4" />
          Wstecz
        </Link>
      </Button>
    );
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
