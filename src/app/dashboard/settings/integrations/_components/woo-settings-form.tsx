'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveWooSettings, testWooConnection } from '../actions';
import { Eye, EyeOff, Save, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WooSettingsFormProps {
	initialSettings: {
		consumerKey: string;
		consumerSecret: string;
		webhookSecret: string;
		wooUrl: string;
	};
    webhookUrl: string;
}

export function WooSettingsForm({ initialSettings, webhookUrl }: WooSettingsFormProps) {
	const [isPending, startTransition] = useTransition();
	const [showSecrets, setShowSecrets] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(async () => {
			await saveWooSettings(formData);
            setTestResult(null); // Reset test result on save
		});
	};

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const result = await testWooConnection();
            setTestResult(result);
        } catch {
            setTestResult({ success: false, message: 'Błąd wywołania testu.' });
        } finally {
            setIsTesting(false);
        }
    };

	return (
		<div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Konfiguracja WooCommerce</CardTitle>
                    <CardDescription>
                        Wprowadź klucze API ze swojego sklepu WooCommerce, aby umożliwić synchronizację zamówień.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="wooUrl">Adres sklepu (URL)</Label>
                            <Input
                                id="wooUrl"
                                name="wooUrl"
                                placeholder="https://twoj-sklep.pl"
                                defaultValue={initialSettings.wooUrl}
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="consumerKey">Consumer Key</Label>
                            <div className="relative">
                                <Input
                                    id="consumerKey"
                                    name="consumerKey"
                                    type={showSecrets ? 'text' : 'password'}
                                    placeholder="ck_..."
                                    defaultValue={initialSettings.consumerKey}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowSecrets(!showSecrets)}
                                >
                                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="consumerSecret">Consumer Secret</Label>
                            <div className="relative">
                                <Input
                                    id="consumerSecret"
                                    name="consumerSecret"
                                    type={showSecrets ? 'text' : 'password'}
                                    placeholder="cs_..."
                                    defaultValue={initialSettings.consumerSecret}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="webhookSecret">Webhook Secret</Label>
                            <div className="relative">
                                <Input
                                    id="webhookSecret"
                                    name="webhookSecret"
                                    type={showSecrets ? 'text' : 'password'}
                                    placeholder="Sekret webhooka..."
                                    defaultValue={initialSettings.webhookSecret}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ten sam sekret musi być ustawiony w WooCommerce przy konfiguracji Webhooka.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Zapisywanie...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Zapisz ustawienia
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status Połączenia</CardTitle>
                    <CardDescription>Sprawdź czy panel poprawnie komunikuje się ze sklepem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${initialSettings.consumerKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-sm text-muted-foreground">
                                {initialSettings.consumerKey ? 'Klucze API zapisane' : 'Brak konfiguracji'}
                            </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting || !initialSettings.consumerKey}>
                            {isTesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Testuj połączenie
                        </Button>
                    </div>

                    {testResult && (
                        <Alert variant={testResult.success ? "default" : "destructive"}>
                            {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <AlertTitle>{testResult.success ? 'Sukces' : 'Błąd'}</AlertTitle>
                            <AlertDescription>
                                {testResult.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-xs font-medium mb-1">Webhook URL</p>
                        <code className="text-xs bg-background px-2 py-1 rounded border block select-all">
                            {webhookUrl}
                        </code>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Skopiuj ten adres do ustawień Webhooka w WooCommerce (WooCommerce {'>'} Ustawienia {'>'} Zaawansowane {'>'} Webhooki).
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
	);
}
