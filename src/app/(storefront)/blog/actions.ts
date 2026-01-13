'use server';

import { db } from '@/lib/db';
import { erpPosts } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function getPublishedPosts() {
    return await db.query.erpPosts.findMany({
        where: eq(erpPosts.status, 'published'),
        orderBy: [desc(erpPosts.publishedAt), desc(erpPosts.createdAt)],
    });
}

export async function getPostBySlug(slug: string) {
    return await db.query.erpPosts.findFirst({
        where: and(
            eq(erpPosts.slug, slug),
            eq(erpPosts.status, 'published')
        ),
        with: {
            author: true
        }
    });
}
