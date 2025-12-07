'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { saveGoogleCalendarSettings } from '../google-actions';

interface GoogleCalendarSettingsFormProps {
  initialCalendarId: string;
  initialClientEmail: string;
  initialPrivateKey: string;
}

export function GoogleCalendarSettingsForm({ initialCalendarId, initialClientEmail, initialPrivateKey }: GoogleCalendarSettingsFormProps) {
  const [calendarId, setCalendarId] = useState(initialCalendarId);
  const [clientEmail, setClientEmail] = useState(initialClientEmail);
  const [privateKey, setPrivateKey] = useState(initialPrivateKey);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useDebouncedCallback(async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('calendarId', calendarId);
      formData.append('clientEmail', clientEmail);
      formData.append('privateKey', privateKey);
      await saveGoogleCalendarSettings(formData);
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

        {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
            </div>
        )}
      </CardContent>
    </Card>
  );
}
