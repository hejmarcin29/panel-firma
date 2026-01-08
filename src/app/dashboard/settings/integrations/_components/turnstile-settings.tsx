'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { saveTurnstileSettings } from '../turnstile-actions';

interface TurnstileSettingsProps {
    initialSiteKey: string | null;
    initialSecretKey: string | null;
}

export function TurnstileSettings({ initialSiteKey, initialSecretKey }: TurnstileSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        
        try {
            await saveTurnstileSettings(formData);
            toast.success('Ustawienia Turnstile zapisane');
        } catch (error) {
            console.error(error);
            toast.error('Wystąpił błąd podczas zapisywania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card id="turnstile">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Cloudflare Turnstile (Ochrona Spam)
                </CardTitle>
                <CardDescription>
                    Skonfiguruj darmową ochronę typu CAPTCHA, aby zabezpieczyć swoje formularze przed botami.
                    Klucze uzyskasz w panelu Cloudflare.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="siteKey">Site Key (Publiczny)</Label>
                        <Input 
                            id="siteKey" 
                            name="siteKey" 
                            defaultValue={initialSiteKey || ''} 
                            placeholder="np. 0x4AAAAAA..." 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="secretKey">Secret Key (Prywatny)</Label>
                         <Input 
                            id="secretKey" 
                            name="secretKey" 
                            type="password"
                            defaultValue={initialSecretKey || ''} 
                            placeholder="np. 0x4AAAAAA..." 
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz klucze
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
