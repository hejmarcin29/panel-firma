'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { refreshAppAction } from '../actions';
import { useTransition } from 'react';
import { toast } from 'sonner';

export function RefreshButton() {
    const [isPending, startTransition] = useTransition();

    const handleRefresh = () => {
        startTransition(async () => {
            try {
                await refreshAppAction();
                window.location.reload();
            } catch {
                toast.error('Błąd odświeżania');
            }
        });
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleRefresh}
            disabled={isPending}
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            <span className="sr-only">Odśwież</span>
        </Button>
    );
}
