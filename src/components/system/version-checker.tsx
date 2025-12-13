'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const CHECK_INTERVAL = 60 * 1000; // Sprawdzaj co minutę

export function VersionChecker() {
    const [serverVersion, setServerVersion] = useState<string | null>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

    useEffect(() => {
        // 1. Pobierz wersję początkową przy załadowaniu aplikacji
        const checkVersion = async (isInitial = false) => {
            try {
                // WAŻNE: Dodajemy timestamp ?t=... aby ominąć cache przeglądarki/Service Workera
                const res = await fetch(`/api/system/version?t=${Date.now()}`);
                if (!res.ok) return;
                
                const data = await res.json();
                const currentVersion = data.version;

                if (isInitial) {
                    setServerVersion(currentVersion);
                } else {
                    if (serverVersion && currentVersion !== serverVersion) {
                        setIsUpdateAvailable(true);
                    }
                }
            } catch (error) {
                console.error('Failed to check version:', error);
            }
        };

        // Pierwsze sprawdzenie
        checkVersion(true);

        // Cykliczne sprawdzanie
        const interval = setInterval(() => checkVersion(false), CHECK_INTERVAL);

        // Sprawdzenie przy powrocie do karty (visibility change)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVersion(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [serverVersion]);

    const handleRefresh = () => {
        // Twarde przeładowanie strony, pomijające cache
        window.location.reload();
    };

    if (!isUpdateAvailable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96"
            >
                <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center justify-between gap-4 border border-primary/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            <ArrowUpCircle className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">Dostępna aktualizacja</span>
                            <span className="text-xs opacity-90">Nowa wersja aplikacji jest gotowa.</span>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={handleRefresh}
                        className="whitespace-nowrap font-semibold shadow-sm active:scale-95 transition-transform"
                    >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Odśwież
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}