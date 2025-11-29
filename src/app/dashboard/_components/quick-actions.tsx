"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Mail } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Szybkie Akcje</CardTitle>
        <CardDescription>Najczęstsze operacje</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button asChild className="w-full justify-start" variant="outline">
            <Link href="/dashboard/montaze?new=true">
                <PlusCircle className="mr-2 h-4 w-4" />
                Dodaj Montaż
            </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="outline">
            <Link href="/dashboard/orders/new">
                <FileText className="mr-2 h-4 w-4" />
                Wystaw Zamówienie
            </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="outline">
            <Link href="/dashboard/mail">
                <Mail className="mr-2 h-4 w-4" />
                Sprawdź Pocztę
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
