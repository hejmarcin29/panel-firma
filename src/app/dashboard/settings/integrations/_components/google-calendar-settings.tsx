'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getGoogleAuthUrl, disconnectGoogle } from '../google-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface GoogleCalendarSettingsProps {
  isConnected: boolean;
}

export function GoogleCalendarSettings({ isConnected }: GoogleCalendarSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth url:', error);
      toast.error('Wystąpił błąd podczas inicjowania połączenia z Google.');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await disconnectGoogle();
      toast.success('Rozłączono z Google Calendar.');
      router.refresh();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Wystąpił błąd podczas rozłączania.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Google Calendar
          {isConnected && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Połącz swoje konto Google, aby synchronizować wydarzenia z kalendarzem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status połączenia</p>
            <p className="text-sm text-muted-foreground">
              {isConnected
                ? 'Twoje konto jest połączone. Wydarzenia będą synchronizowane.'
                : 'Brak połączenia. Kliknij przycisk, aby połączyć.'}
            </p>
          </div>
          
          {isConnected ? (
            <Button 
              variant="destructive" 
              onClick={handleDisconnect} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Rozłącz
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleConnect} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src="https://www.google.com/favicon.ico" alt="Google" className="mr-2 h-4 w-4" />
              )}
              Połącz z Google
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
