'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { submitReferralLead } from '../../actions';

export function ReferralForm({ token }: { token: string }) {
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await submitReferralLead(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                setIsSuccess(true);
                toast.success('Zgłoszenie wysłane pomyślnie!');
            }
        });
    };

    if (isSuccess) {
        return (
            <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Dziękujemy!</h3>
                <p className="text-muted-foreground">
                    Twoje zgłoszenie zostało przyjęte. Skontaktujemy się z Tobą wkrótce.
                </p>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            
            <div className="grid gap-2">
                <Label htmlFor="clientName">Imię i Nazwisko</Label>
                <Input id="clientName" name="clientName" required placeholder="Jan Kowalski" disabled={isPending} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="phone">Numer telefonu</Label>
                <Input id="phone" name="phone" required placeholder="123 456 789" disabled={isPending} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="city">Miejscowość (opcjonalnie)</Label>
                <Input id="city" name="city" placeholder="Warszawa" disabled={isPending} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Czego potrzebujesz? (opcjonalnie)</Label>
                <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Np. panele winylowe do salonu, ok. 40m2" 
                    disabled={isPending} 
                />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Wyślij zgłoszenie
            </Button>
        </form>
    );
}
