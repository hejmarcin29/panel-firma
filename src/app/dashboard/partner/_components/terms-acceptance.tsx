'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { acceptTerms } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function TermsAcceptance() {
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAccept = async () => {
        if (!accepted) return;
        
        setLoading(true);
        try {
            const result = await acceptTerms();
            if (result.success) {
                toast.success('Warunki współpracy zostały zaakceptowane');
                router.refresh();
            } else {
                toast.error('Wystąpił błąd podczas akceptacji warunków');
            }
        } catch {
            toast.error('Wystąpił błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-lg border-2">
                <CardHeader>
                    <CardTitle>Warunki Współpracy Partnerskiej</CardTitle>
                    <CardDescription>
                        Aby korzystać z panelu partnera, musisz zaakceptować regulamin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-64 overflow-y-auto border rounded-md p-4 text-sm text-muted-foreground bg-muted/50">
                        <h4 className="font-bold mb-2">1. Postanowienia ogólne</h4>
                        <p className="mb-2">
                            Niniejszy regulamin określa zasady współpracy w ramach programu partnerskiego.
                            Partner zobowiązuje się do promowania usług firmy w sposób rzetelny i zgodny z prawem.
                        </p>
                        
                        <h4 className="font-bold mb-2">2. Prowizje i Rozliczenia</h4>
                        <p className="mb-2">
                            Partner otrzymuje prowizję od każdego zrealizowanego zamówienia pozyskanego z jego polecenia.
                            Wysokość prowizji jest ustalana indywidualnie w profilu Partnera.
                        </p>
                        <p className="mb-2">
                            Wypłata środków następuje na podstawie wystawionej przez Partnera faktury VAT lub rachunku.
                            Minimalna kwota wypłaty to 100 PLN.
                        </p>

                        <h4 className="font-bold mb-2">3. Obowiązki Partnera</h4>
                        <p className="mb-2">
                            Partner zobowiązuje się do niepodejmowania działań mogących zaszkodzić wizerunkowi firmy.
                            Zakazane jest wysyłanie spamu oraz wprowadzanie klientów w błąd.
                        </p>
                        
                        <h4 className="font-bold mb-2">4. Przetwarzanie Danych</h4>
                        <p>
                            Dane osobowe Partnera są przetwarzane w celu realizacji umowy współpracy i rozliczeń finansowych.
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox 
                            id="terms" 
                            checked={accepted} 
                            onCheckedChange={(checked) => setAccepted(checked as boolean)} 
                        />
                        <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Zapoznałem się z regulaminem i akceptuję jego warunki
                        </Label>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full" 
                        onClick={handleAccept} 
                        disabled={!accepted || loading}
                    >
                        {loading ? 'Przetwarzanie...' : 'Akceptuję i przechodzę do panelu'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
