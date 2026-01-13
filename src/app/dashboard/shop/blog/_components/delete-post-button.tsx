'use client';

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deletePost } from "../actions";
import { useTransition } from "react";
import { toast } from "sonner"; // Assuming sonner is used, if not I should check components. list_dir indicated sonner.tsx exists.

export function DeletePostButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm('Czy na pewno chcesz usunąć ten wpis?')) {
            startTransition(async () => {
                await deletePost(id);
                toast.success('Usunięto wpis');
            });
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete} 
            disabled={isPending}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Usuń"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
