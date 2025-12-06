'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { saveWooSettings, testWooConnection } from '../actions';

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
const [formData, setFormData] = useState({
consumerKey: initialSettings.consumerKey,
consumerSecret: initialSettings.consumerSecret,
webhookSecret: initialSettings.webhookSecret,
wooUrl: initialSettings.wooUrl,
});

const [showSecrets, setShowSecrets] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
const [isSaving, setIsSaving] = useState(false);

const debouncedSave = useDebouncedCallback(async (data: typeof formData) => {
setIsSaving(true);
try {
const formDataToSend = new FormData();
formDataToSend.append('consumerKey', data.consumerKey);
formDataToSend.append('consumerSecret', data.consumerSecret);
formDataToSend.append('webhookSecret', data.webhookSecret);
formDataToSend.append('wooUrl', data.wooUrl);

await saveWooSettings(formDataToSend);
setTestResult(null);
} catch (_) {
toast.error('Błąd zapisu ustawień WooCommerce');
} finally {
setIsSaving(false);
}
}, 1000);

const handleChange = (field: keyof typeof formData, value: string) => {
const newData = { ...formData, [field]: value };
setFormData(newData);
debouncedSave(newData);
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
<div className='space-y-6'>
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle>Konfiguracja WooCommerce</CardTitle>
                            <CardDescription>
                                Wprowadź klucze API ze swojego sklepu WooCommerce, aby umożliwić synchronizację zamówień.
                            </CardDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                            {isSaving ? (
                                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                    <Loader2 className='w-3 h-3 animate-spin' />
                                    Zapisywanie...
                                </span>
                            ) : (
                                <span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isSaving}>
                                    <Check className='w-3 h-3' />
                                    Zapisano
                                </span>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='wooUrl'>Adres sklepu (URL)</Label>
                            <Input
                                id='wooUrl'
                                value={formData.wooUrl}
                                onChange={(e) => handleChange('wooUrl', e.target.value)}
                                placeholder='https://twoj-sklep.pl'
                            />
                        </div>
                        
                        <div className='space-y-2'>
                            <Label htmlFor='consumerKey'>Consumer Key</Label>
                            <div className='relative'>
                                <Input
                                    id='consumerKey'
                                    type={showSecrets ? 'text' : 'password'}
                                    value={formData.consumerKey}
                                    onChange={(e) => handleChange('consumerKey', e.target.value)}
                                    placeholder='ck_...'
                                />
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                                    onClick={() => setShowSecrets(!showSecrets)}
                                >
                                    {showSecrets ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                </Button>
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='consumerSecret'>Consumer Secret</Label>
                            <div className='relative'>
                                <Input
                                    id='consumerSecret'
                                    type={showSecrets ? 'text' : 'password'}
                                    value={formData.consumerSecret}
                                    onChange={(e) => handleChange('consumerSecret', e.target.value)}
                                    placeholder='cs_...'
                                />
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='webhookSecret'>Webhook Secret</Label>
                            <div className='relative'>
                                <Input
                                    id='webhookSecret'
                                    type={showSecrets ? 'text' : 'password'}
                                    value={formData.webhookSecret}
                                    onChange={(e) => handleChange('webhookSecret', e.target.value)}
                                    placeholder='Sekret webhooka...'
                                />
                            </div>
                            <p className='text-xs text-muted-foreground'>
                                Ten sam sekret musi być ustawiony w WooCommerce przy konfiguracji Webhooka.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status Połączenia</CardTitle>
                    <CardDescription>Sprawdź czy panel poprawnie komunikuje się ze sklepem.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <div className={`h-3 w-3 rounded-full ${formData.consumerKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className='text-sm text-muted-foreground'>
                                {formData.consumerKey ? 'Klucze API zapisane' : 'Brak konfiguracji'}
                            </span>
                        </div>
                        <Button variant='outline' size='sm' onClick={handleTestConnection} disabled={isTesting || !formData.consumerKey}>
                            {isTesting ? <RefreshCw className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
                            Testuj połączenie
                        </Button>
                    </div>

                    {testResult && (
                        <Alert variant={testResult.success ? 'default' : 'destructive'}>
                            {testResult.success ? <CheckCircle2 className='h-4 w-4' /> : <XCircle className='h-4 w-4' />}
                            <AlertTitle>{testResult.success ? 'Sukces' : 'Błąd'}</AlertTitle>
                            <AlertDescription>
                                {testResult.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className='p-4 border rounded-lg bg-muted/50'>
                        <p className='text-xs font-medium mb-1'>Webhook URL</p>
                        <code className='text-xs bg-background px-2 py-1 rounded border block select-all'>
                            {webhookUrl}
                        </code>
                        <p className='text-[10px] text-muted-foreground mt-1'>
                            Skopiuj ten adres do ustawień Webhooka w WooCommerce (WooCommerce {'>'} Ustawienia {'>'} Zaawansowane {'>'} Webhooki).
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
);
}
