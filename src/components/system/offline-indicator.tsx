'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function onOffline() {
      setIsOffline(true);
      toast.warning('Utracono połączenie z internetem', {
        id: 'offline-toast',
        duration: Infinity,
        icon: <WifiOff className="h-4 w-4" />,
      });
    }

    function onOnline() {
      setIsOffline(false);
      toast.dismiss('offline-toast');
      toast.success('Przywrócono połączenie', {
        duration: 3000,
        icon: <Wifi className="h-4 w-4" />,
      });
    }

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!isOffline) return null;

  // We rely on Sonner toast for the main notification, 
  // but we can also render a subtle persistent indicator if needed.
  // For now, the toast is sufficient as configured above.
  return null;
}
