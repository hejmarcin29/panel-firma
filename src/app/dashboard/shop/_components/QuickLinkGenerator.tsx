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
        } catch (error) {
            toast.error('Wystąpił błąd');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.success('Skopiowano do schowka');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <CardTitle>Szybki Link do Sklepu</CardTitle>
                </div>
                <CardDescription>
                    Wygeneruj unikalny link dla klienta, który pozwoli mu składać zamówienia bez logowania.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!generatedLink ? (
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email klienta</label>
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
