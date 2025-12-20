'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { saveGoogleCalendarSettings, testGoogleCalendarConnection } from '../google-actions';

interface GoogleCalendarSettingsFormProps {
  initialCalendarId: string;
  initialClientEmail: string;
  initialPrivateKey: string;
  initialOAuthClientId: string;
  initialOAuthClientSecret: string;
}

export function GoogleCalendarSettingsForm({ 
    initialCalendarId, 
    initialClientEmail, 
    initialPrivateKey,
    initialOAuthClientId,
    initialOAuthClientSecret
}: GoogleCalendarSettingsFormProps) {
  const [calendarId, setCalendarId] = useState(initialCalendarId);
  const [clientEmail, setClientEmail] = useState(initialClientEmail);
  const [privateKey, setPrivateKey] = useState(initialPrivateKey);
  const [oauthClientId, setOAuthClientId] = useState(initialOAuthClientId);
  const [oauthClientSecret, setOAuthClientSecret] = useState(initialOAuthClientSecret);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const debouncedSave = useDebouncedCallback(async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('calendarId', calendarId);
      formData.append('clientEmail', clientEmail);
      formData.append('privateKey', privateKey);
      formData.append('oauthClientId', oauthClientId);
      formData.append('oauthClientSecret', oauthClientSecret);
      await saveGoogleCalendarSettings(formData);
      setTestResult(null); // Reset test result on change
    } catch {
      toast.error('Błąd zapisu ustawień Kalendarza Google');
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setter(value);
    debouncedSave();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
        const result = await testGoogleCalendarConnection();
        setTestResult(result);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    } catch {
        toast.error('Wystąpił błąd podczas testowania połączenia.');
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Kalendarz Google
        </CardTitle>
        <CardDescription>
          Skonfiguruj integrację z Kalendarzem Google, aby automatycznie synchronizować montaże.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="calendarId">ID Kalendarza (Calendar ID)</Label>
          <Input
            id="calendarId"
            placeholder="np. twoj.email@gmail.com"
            value={calendarId}
            onChange={handleChange(setCalendarId)}
          />
          <p className="text-xs text-muted-foreground">
            To zazwyczaj Twój adres e-mail (dla głównego kalendarza) lub ID grupy.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">E-mail Konta Usługi (Service Account Email)</Label>
          <Input
            id="clientEmail"
            placeholder="np. panel-kalendarz@twoj-projekt.iam.gserviceaccount.com"
            value={clientEmail}
            onChange={handleChange(setClientEmail)}
          />
          <p className="text-xs text-muted-foreground">
            Adres e-mail wygenerowany w Google Cloud Console (kończący się na .iam.gserviceaccount.com).
            <strong> Pamiętaj, aby udostępnić swój kalendarz dla tego adresu!</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="privateKey">Klucz Prywatny (Private Key)</Label>
          <textarea
            id="privateKey"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="-----BEGIN PRIVATE KEY----- ..."
            value={privateKey}
            onChange={handleChange(setPrivateKey)}
          />
          <p className="text-xs text-muted-foreground">
            Cała zawartość klucza prywatnego z pliku JSON (włącznie z liniami BEGIN i END).
          </p>
        </div>

        <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-3">Logowanie Montażystów (OAuth 2.0)</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oauthClientId">Client ID</Label>
                <Input
                  id="oauthClientId"
                  value={oauthClientId}
                  onChange={handleChange(setOAuthClientId)}
                  placeholder="np. 123456789-abc...apps.googleusercontent.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oauthClientSecret">Client Secret</Label>
                <Input
                  id="oauthClientSecret"
                  type="password"
                  value={oauthClientSecret}
                  onChange={handleChange(setOAuthClientSecret)}
                  placeholder="np. GOCSPX-..."
                />
              </div>
            </div>
        </div>

        <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isSaving && (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Zapisywanie...
                    </>
                )}
            </div>
            <Button 
                variant="outline" 
                onClick={handleTestConnection} 
                disabled={isTesting || isSaving || !calendarId || !clientEmail || !privateKey}
            >
                {isTesting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testowanie...
                    </>
                ) : (
                    'Testuj połączenie'
                )}
            </Button>
        </div>

        {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'} className={testResult.success ? 'border-emerald-500 text-emerald-600' : ''}>
                <AlertTitle>{testResult.success ? 'Sukces' : 'Błąd'}</AlertTitle>
                <AlertDescription>
                    {testResult.message}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
