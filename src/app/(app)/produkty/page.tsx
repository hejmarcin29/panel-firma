import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProduktyPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Katalog produktów</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          W tej sekcji docelowo pojawi się pełna lista paneli, akcesoriów i usług montażowych wraz z integracją magazynu.
        </p>
      </header>

      <Card className="rounded-3xl border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Szybkie akcje</CardTitle>
            <CardDescription>Dodawanie nowych pozycji do oferty i import arkuszy stanów magazynowych.</CardDescription>
          </div>
          <Button className="rounded-2xl" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nowy produkt
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="py-6 text-sm text-muted-foreground">
          Moduł w przygotowaniu. Zdefiniujmy strukturę danych zanim podłączymy źródło z WordPressa lub ERP.
        </CardContent>
      </Card>
    </div>
  );
}
