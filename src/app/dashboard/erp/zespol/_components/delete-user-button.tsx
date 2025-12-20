'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteUser } from '../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            await deleteUser(userId);
            toast.success(`Użytkownik ${userName} został usunięty`);
            setOpen(false);
            router.push('/dashboard/erp/zespol');
        } catch (error) {
            toast.error('Nie udało się usunąć użytkownika');
            console.error(error);
            setIsLoading(false);
            // Keep dialog open on error so user can try again or cancel
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2"
                >
                    <Trash2 className="h-4 w-4" />
                    Usuń
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć tego pracownika?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Użytkownik <strong>{userName}</strong> zostanie trwale usunięty z systemu.
                        Tej operacji nie można cofnąć.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Usuń pracownika
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
