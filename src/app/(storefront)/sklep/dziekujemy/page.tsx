import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, Package, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
    title: 'Dziękujemy za zamówienie | Prime Podłoga',
    description: 'Twoje zamówienie zostało przyjęte do realizacji.',
};

export default function ShopThankYouPage() {
    return (
        <div className="container min-h-[60vh] flex flex-col items-center justify-center py-16 space-y-8 text-center">
            
            <div className="rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-4 max-w-lg">
                <h1 className="text-3xl font-bold font-playfair sm:text-4xl text-foreground">
                    Dziękujemy za zamówienie!
                </h1>
                <p className="text-lg text-muted-foreground">
                    Twoja podłoga jest o krok bliżej. Otrzymasz potwierdzenie zamówienia oraz szczegóły płatności na podany adres e-mail.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 w-full max-w-2xl px-4">
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                        <Package className="h-8 w-8 text-amber-600" />
                        <h3 className="font-semibold">Szybka Realizacja</h3>
                        <p className="text-sm text-center text-muted-foreground">
                            Nasz magazynier już kompletuje Twoje panele. Staramy się wysyłać zamówienia w 24h.
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                        <Truck className="h-8 w-8 text-blue-600" />
                        <h3 className="font-semibold">Bezpieczna Dostawa</h3>
                        <p className="text-sm text-center text-muted-foreground">
                            Dostarczymy towar na palecie, zabezpieczony i ubezpieczony. Kierowca zadzwoni przed dostawą.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/sklep">
                        Wróć do sklepu <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
