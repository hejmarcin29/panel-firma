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
}

export function GoogleCalendarSettingsForm({ initialCalendarId }: GoogleCalendarSettingsFormProps) {
  const [calendarId, setCalendarId] = useState(initialCalendarId);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useDebouncedCallback(async (value: string) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('calendarId', value);
      await saveGoogleCalendarSettings(formData);
    } catch {
      toast.error('Błąd zapisu ustawień Kalendarza Google');
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCalendarId(value);
    debouncedSave(value);
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
          <div className="relative">
            <Input
              id="calendarId"
              placeholder="np. twoj.email@gmail.com"
              value={calendarId}
              onChange={handleChange}
            />
            {isSaving && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            To zazwyczaj Twój adres e-mail (dla głównego kalendarza) lub ID grupy.
            <br />
            <strong>Ważne:</strong> Pamiętaj, aby udostępnić ten kalendarz dla konta usługi (Service Account) z uprawnieniami do edycji.
            Adres e-mail konta usługi znajdziesz w pliku <code>.env</code> (GOOGLE_CLIENT_EMAIL).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
