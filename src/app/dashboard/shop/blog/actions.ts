'use server';

import { db } from '@/lib/db';
import { erpPosts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getPosts() {
    return await db.query.erpPosts.findMany({
        orderBy: [desc(erpPosts.createdAt)],
    });
}

export async function getPost(id: string) {
    return await db.query.erpPosts.findFirst({
        where: eq(erpPosts.id, id),
    });
}

export async function deletePost(id: string) {
    if (!id) return;
    await db.delete(erpPosts).where(eq(erpPosts.id, id));
    revalidatePath('/dashboard/shop/blog');
}

export async function upsertPost(data: any) {
    // Basic validation
    if (!data.title || !data.slug) {
        throw new Error('Title and Slug are required');
    }

    const id = data.id || crypto.randomUUID();

    const postData = {
        id: id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        status: data.status,
        authorId: data.authorId,
        publishedAt: data.status === 'published' && !data.publishedAt ? new Date() : (data.publishedAt ? new Date(data.publishedAt) : null),
        updatedAt: new Date(),
    };

    await db.insert(erpPosts).values(postData)
        .onConflictDoUpdate({
            target: erpPosts.id,
            set: {
                ...postData,
                // preserve createdAt
            },
        });

    revalidatePath('/dashboard/shop/blog');
    
    // Redirect logic: if it was a new post, redirect to list. If edit, stay or redirect?
    // Usually redirect to list is best.
}
