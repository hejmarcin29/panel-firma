import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // uuid (string)
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp_ms' }),
  image: text('image'),
  // Custom fields
  role: text('role').notNull().default('admin'), // 'admin' | 'installer' | 'office' | 'manager'
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
})

export const sessions = sqliteTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
})

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  compositePk: primaryKey({ columns: [table.identifier, table.token] }),
}))

export const accounts = sqliteTable('accounts', {
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}))

export type User = typeof users.$inferSelect

// Clients
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(), // uuid text
  name: text('name').notNull(), // Imię i nazwisko
  phone: text('phone'), // numer tel.
  email: text('email'), // email (niekoniecznie unikalny na start)
  invoiceCity: text('invoice_city'), // miasto (faktura)
  invoiceAddress: text('invoice_address'), // adres (faktura)
  deliveryCity: text('delivery_city'), // miasto (dostawa)
  deliveryAddress: text('delivery_address'), // adres (dostawa)
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
})

export type Client = typeof clients.$inferSelect

export const clientNotes = sqliteTable('client_notes', {
  id: text('id').primaryKey(), // uuid text
  clientId: text('client_id').notNull(),
  content: text('content').notNull(), // notatka Primepodloga
  createdBy: text('created_by'), // users.id (opcjonalnie)
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
})

export type ClientNote = typeof clientNotes.$inferSelect
