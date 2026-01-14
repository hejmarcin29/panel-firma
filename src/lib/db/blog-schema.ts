import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema';

export const postStatus = ['draft', 'published'] as const;
export type PostStatus = (typeof postStatus)[number];

export const erpPosts = pgTable(
  'erp_posts',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'), // HTML content
    excerpt: text('excerpt'),
    featuredImage: text('featured_image'),
    
    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    
    status: text('status').$type<PostStatus>().default('draft').notNull(),
    
    authorId: text('author_id').references(() => users.id),
    
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('erp_posts_slug_idx').on(table.slug),
    statusIdx: index('erp_posts_status_idx').on(table.status),
    publishedAtIdx: index('erp_posts_published_at_idx').on(table.publishedAt),
  })
);

export const erpPostsRelations = relations(erpPosts, ({ one }) => ({
  author: one(users, {
    fields: [erpPosts.authorId],
    references: [users.id],
  }),
}));
