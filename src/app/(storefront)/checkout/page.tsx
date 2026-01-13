import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="container min-h-[60vh] py-20 flex flex-col items-center justify-center text-center space-y-6">
       <div className="text-4xl">🚧</div>
       <h1 className="text-3xl font-bold font-playfair">Zamówienie</h1>
       <p className="text-muted-foreground max-w-md">
         Funkcja zamawiania i płatności jest w trakcie wdrażania.
         <br/>
         W tym momencie prosimy o kontakt telefoniczny w celu finalizacji zamówienia.
       </p>
       <Button asChild>
          <Link href="/sklep">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Wróć do sklepu
          </Link>
       </Button>
    </div>
  );
}
