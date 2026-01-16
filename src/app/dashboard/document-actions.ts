'use server';

import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';

/**
 * Global action to delete a document (faktura, dokument księgowy from 'documents' table).
 * Enforces 'admin' role check.
 * 
 * @param documentId UUID of the document
 * @param pathToRevalidate Optional path to revalidate after deletion
 */
export async function deleteDocument(documentId: string, pathToRevalidate?: string) {
    const user = await requireUser();
    
    // RBAC Check: Only admin can delete documents
    if (!user.roles.includes('admin')) {
        throw new Error('Tylko administrator może usuwać dokumenty księgowe.');
    }

    // In a real scenario, we should also delete from R2, but soft-delete or keeping it is fine for now/safe.
    // For now, let's just delete the DB record.
    await db.delete(documents).where(eq(documents.id, documentId));
    
    if (pathToRevalidate) {
        revalidatePath(pathToRevalidate);
    }
    
    return { success: true };
}
