'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { importWPPosts } from '../wp-import.action';
import { useRouter } from 'next/navigation';

export function ImportButton() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleImport = async () => {
        try {
            setIsLoading(true);
            toast.info('Rozpoczynam import z WordPress...');
            
            const result = await importWPPosts();
            
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(`Błąd importu: ${result.message}`);
            }
        } catch (error) {
            toast.error('Wystąpił nieoczekiwany błąd.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button 
            variant="outline" 
            onClick={handleImport} 
            disabled={isLoading}
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <DownloadCloud className="h-4 w-4" />
            )}
            {isLoading ? 'Importowanie...' : 'Import z WP'}
        </Button>
    );
}
