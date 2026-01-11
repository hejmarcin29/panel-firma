'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateQuickShopLink } from '../actions';
import { toast } from 'sonner';
import { Copy, Loader2, Sparkles } from 'lucide-react';

export function QuickLinkGenerator() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            const result = await generateQuickShopLink(email, name);
            if (result.success && result.url) {
                setGeneratedLink(result.url);
                toast.success('Link wygenerowany pomyślnie');
            } else {
                toast.error(result.error || 'Błąd generowania linku');
            }
        } catch {
            toast.error('Wystąpił błąd');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.success('Skopiowano do schowka');
    };

    const copyGeneralLink = () => {
        const url = `${window.location.origin}/sklep`;
        navigator.clipboard.writeText(url);
        toast.success('Skopiowano link ogólny');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <CardTitle>Linki do Sklepu</CardTitle>
                </div>
                <CardDescription>
                    Wybierz rodzaj linku który chcesz wysłać klientowi.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* 1. General Link */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Link Ogólny (Klient sam wpisuje dane)</label>
                    <div className="flex gap-2">
                         <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal" onClick={copyGeneralLink}>
                            https://b2b.../sklep
                         </Button>
                         <Button size="icon" variant="ghost" onClick={copyGeneralLink} title="Kopiuj">
                             <Copy className="h-4 w-4" />
                         </Button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">LUB SPERSONALIZUJ (Magic Link)</span>
                    </div>
                </div>

                {/* 2. Personalized Generator */}
                {!generatedLink ? (
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email klienta (do pre-wypełnienia)</label>
                            <Input 
                                placeholder="klient@example.com" 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Nazwa (opcjonalnie)</label>
                            <Input 
                                placeholder="Jan Kowalski / Firma" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generuj Link
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Wygenerowany link:</p>
                            <div className="flex items-center gap-2">
                                <Input value={generatedLink} readOnly className="bg-white" onClick={e => e.currentTarget.select()} />
                                <Button size="icon" variant="outline" onClick={copyToClipboard} title="Kopiuj">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full" onClick={() => {
                            setGeneratedLink('');
                            setEmail('');
                            setName('');
                        }}>
                            Generuj kolejny
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
