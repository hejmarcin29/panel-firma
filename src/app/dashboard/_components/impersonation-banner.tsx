'use client';

import { stopImpersonatingAction } from '../actions';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function ImpersonationBanner() {
    return (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-sm font-medium shadow-md relative z-50">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Jesteś zalogowany w trybie podglądu innego użytkownika.</span>
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => stopImpersonatingAction()}
                className="h-7 text-xs bg-white text-amber-700 hover:bg-amber-50 border-0"
            >
                Wróć do konta Administratora
            </Button>
        </div>
    );
}
