'use client';

import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { impersonateUserAction } from '../actions';
import { toast } from 'sonner';

interface ImpersonateButtonProps {
    userId: string;
    userName: string;
}

export function ImpersonateButton({ userId, userName }: ImpersonateButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleImpersonate = async () => {
        try {
            setIsLoading(true);
            await impersonateUserAction(userId);
            toast.success(`Zalogowano jako ${userName}`);
            // Redirect is handled by the server action or middleware usually, 
            // but if not, we might need to refresh or redirect manually.
            // Assuming impersonateUserAction sets a cookie and we just need to reload/redirect.
            window.location.href = '/dashboard';
        } catch (error) {
            toast.error('Nie udało się zalogować jako użytkownik');
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleImpersonate} 
            disabled={isLoading}
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogIn className="h-4 w-4" />
            )}
            Zaloguj jako
        </Button>
    );
}
