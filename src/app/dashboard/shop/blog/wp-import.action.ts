'use server';

import { db } from '@/lib/db';
import { erpPosts, users } from '@/lib/db/schema'; // users might be needed
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface WPPost {
    id: number;
    date: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    _embedded?: {
        'wp:featuredmedia'?: Array<{
            source_url: string;
            alt_text?: string;
        }>;
    };
    yoast_head_json?: {
        title?: string;
        description?: string;
    }
}

export async function importWPPosts() {
    try {
        const wpApiUrl = 'https://primepodloga.pl/wp-json/wp/v2/posts?per_page=50&_embed';
        console.log(`Fetching from ${wpApiUrl}...`);
        
        const res = await fetch(wpApiUrl, { cache: 'no-store' });
        
        if (!res.ok) {
            return { success: false, message: `Failed to fetch from WP: ${res.statusText}` };
        }

        const data: WPPost[] = await res.json();
        console.log(`Found ${data.length} posts.`);

        // Find a default author (first user)
        const defaultAuthor = await db.query.users.findFirst();
        const authorId = defaultAuthor?.id;

        let importedCount = 0;
        let updatedCount = 0;

        for (const post of data) {
            // Check if exists by slug
            const existing = await db.query.erpPosts.findFirst({
                where: eq(erpPosts.slug, post.slug),
            });

            const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
            
            // Basic cleanup of content if needed (e.g. remove specific WP shortcodes?)
            // For now, raw HTML is fine as we used Tiptap which handles HTML.

            const postData = {
                title: post.title.rendered,
                slug: post.slug,
                content: post.content.rendered,
                excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 300), // Strip tags for excerpt
                featuredImage: featuredImage,
                metaTitle: post.yoast_head_json?.title || post.title.rendered,
                metaDescription: post.yoast_head_json?.description || '',
                status: 'published' as const, // WP API usually returns published posts
                authorId: authorId,
                publishedAt: new Date(post.date),
                updatedAt: new Date(),
            };

            if (existing) {
                // Update existing
                await db.update(erpPosts)
                    .set(postData)
                    .where(eq(erpPosts.id, existing.id));
                updatedCount++;
            } else {
                // Insert new
                await db.insert(erpPosts).values({
                    id: crypto.randomUUID(),
                    ...postData,
                    createdAt: new Date(post.date),
                });
                importedCount++;
            }
        }

        revalidatePath('/dashboard/shop/blog');
        revalidatePath('/blog');
        
        return { 
            success: true, 
            message: `Zaimportowano: ${importedCount}, Zaktualizowano: ${updatedCount} z ${data.length} pobranych.` 
        };

    } catch (error: any) {
        console.error('Import Error:', error);
        return { success: false, message: error.message };
    }
}
