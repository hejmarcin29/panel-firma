'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  getGoogleAuthUrlAction,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  listGoogleCalendars,
  setTargetCalendar,
} from '../actions';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface GoogleCalendar {
  id?: string | null;
  summary?: string | null;
  primary?: boolean | null;
}

export function GoogleCalendarSettings() {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [targetCalendarId, setTargetCalendarId] = useState<string>('');

  useEffect(() => {
    async function loadCalendars() {
      try {
        const items = await listGoogleCalendars();
        setCalendars(items);
      } catch (error) {
        console.error(error);
        toast.error('Nie udało się pobrać listy kalendarzy');
      }
    }

    async function loadStatus() {
      try {
        const status = await getGoogleCalendarStatus();
        setIsConnected(status.isConnected);
        if (status.isConnected) {
          setTargetCalendarId(status.targetCalendarId || '');
          loadCalendars();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  async function handleConnect() {
    try {
      const url = await getGoogleAuthUrlAction();
      window.location.href = url;
    } catch {
      toast.error('Błąd podczas inicjowania logowania');
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectGoogleCalendar();
      setIsConnected(false);
      setTargetCalendarId('');
      setCalendars([]);
      toast.success('Odłączono konto Google');
    } catch {
      toast.error('Błąd podczas odłączania');
    }
  }

  async function handleCalendarChange(value: string) {
    try {
      await setTargetCalendar(value);
      setTargetCalendarId(value);
      toast.success('Zapisano kalendarz docelowy');
    } catch {
      toast.error('Błąd zapisu');
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalendarz Google</CardTitle>
        <CardDescription>
          Synchronizuj montaże z Twoim kalendarzem Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isConnected ? 'Połączono' : 'Niepołączono'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? 'Twoje konto Google jest połączone.'
                  : 'Połącz konto, aby włączyć synchronizację.'}
              </p>
            </div>
          </div>
          {isConnected ? (
            <Button variant="outline" onClick={handleDisconnect}>
              Odłącz
            </Button>
          ) : (
            <Button onClick={handleConnect}>Połącz z Google</Button>
          )}
        </div>

        {isConnected && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Wybierz kalendarz</label>
            <Select
              value={targetCalendarId}
              onValueChange={handleCalendarChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kalendarz..." />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary && '(Główny)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Wszystkie nowe montaże będą dodawane do tego kalendarza.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
