'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateSampleSettingsAction } from '../actions';
import { toast } from 'sonner';

interface SampleOrderSettingsProps {
    initialSettings?: {
        notificationEmail: string | null;
        confirmationSubject: string | null;
        confirmationTemplate: string | null;
    };
}

export function SampleOrderSettings({ initialSettings }: SampleOrderSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState(initialSettings?.notificationEmail || '');
    const [subject, setSubject] = useState(initialSettings?.confirmationSubject || 'Potwierdzenie zamówienia próbek');
    const [template, setTemplate] = useState(initialSettings?.confirmationTemplate || 'Dziękujemy za zamówienie próbek. Wyślemy je w ciągu 24h.');

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateSampleSettingsAction({
                    notificationEmail: email,
                    confirmationSubject: subject,
                    confirmationTemplate: template
                });
                toast.success('Ustawienia próbek zapisane');
            } catch (error) {
                toast.error('Błąd zapisu ustawień');
            }
        });
    };

    return (
        <Card className="border-indigo-100">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs">📦</span>
                    Zamówienia Próbek (Sklep)
                </CardTitle>
                <CardDescription>
                    Konfiguracja powiadomień e-mail dla procesu zamawiania darmowych próbek.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Email powiadomień (Internal)</Label>
                    <Input 
                        placeholder="np. magazyn@firma.pl" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Na ten adres trafi informacja o nowym zamówieniu próbek do realizacji.
                    </p>
                </div>

                <div className="grid gap-2">
                    <Label>Temat wiadomości do klienta</Label>
                    <Input 
                        placeholder="Temat e-maila" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Szablon wiadomości do klienta</Label>
                    <Textarea 
                        className="min-h-[100px]"
                        placeholder="Treść wiadomości..." 
                        value={template} 
                        onChange={(e) => setTemplate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Proste potwierdzenie wysłane do klienta po złożeniu zamówienia.
                    </p>
                </div>

                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? 'Zapisywanie...' : 'Zapisz Konfigurację'}
                </Button>
            </CardContent>
        </Card>
    );
}
