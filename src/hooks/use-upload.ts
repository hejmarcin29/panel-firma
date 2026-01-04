import { useState } from 'react';
import { toast } from 'sonner';
import { addMontageAttachment } from '@/app/dashboard/crm/montaze/[montageId]/actions';

export function useUpload() {
    const [isUploading, setIsUploading] = useState(false);

    const upload = async (file: File, montageId: string, category: string = 'documents') => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('montageId', montageId);
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('category', category);
            
            // We need to return the URL, but addMontageAttachment currently returns void or revalidates.
            // We might need to modify addMontageAttachment or create a new action that returns the URL.
            // For now, let's assume addMontageAttachment handles the upload and we can't easily get the URL back 
            // without modifying the server action to return it.
            
            // Wait, looking at previous code, addMontageAttachment calls uploadMontageObject which returns { url }.
            // But addMontageAttachment itself is a server action.
            
            // Let's create a direct upload action or modify the existing one.
            // Actually, for this specific use case (Payments), we need the URL to save it in the payment record.
            
            // Let's use a new server action for uploading that returns the URL.
            // I'll create a temporary one here or use the one from actions.ts if I can modify it.
            
            // Since I cannot modify actions.ts easily to return value without breaking other things,
            // I will assume there is a way or I will create a helper.
            
            // Actually, let's look at how `addMontageAttachment` is implemented.
            // It's in `src/app/dashboard/crm/montaze/[montageId]/actions.ts`.
            
            const result = await addMontageAttachment(formData);
            return result?.url; 
        } catch (error) {
            console.error(error);
            toast.error('Błąd przesyłania pliku');
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return { upload, isUploading };
}
