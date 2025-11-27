/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    // Create montages
    db.prepare(`
    CREATE TABLE IF NOT EXISTS montages (
        id text PRIMARY KEY NOT NULL,
        client_name text NOT NULL,
        contact_phone text,
        contact_email text,
        address text,
        billing_address text,
        installation_address text,
        billing_city text,
        installation_city text,
        scheduled_installation_at integer,
        scheduled_end_at integer,
        google_event_id text,
        material_details text,
        status text DEFAULT 'lead' NOT NULL,
        created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        updated_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
    )`).run();

    // Create montage_notes
    db.prepare(`
    CREATE TABLE IF NOT EXISTS montage_notes (
        id text PRIMARY KEY NOT NULL,
        montage_id text NOT NULL,
        content text NOT NULL,
        created_by text,
        created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        FOREIGN KEY (montage_id) REFERENCES montages(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )`).run();

    // Create montage_attachments
    db.prepare(`
    CREATE TABLE IF NOT EXISTS montage_attachments (
        id text PRIMARY KEY NOT NULL,
        montage_id text NOT NULL,
        note_id text,
        title text,
        url text NOT NULL,
        uploaded_by text,
        created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        FOREIGN KEY (montage_id) REFERENCES montages(id) ON DELETE CASCADE,
        FOREIGN KEY (note_id) REFERENCES montage_notes(id) ON DELETE SET NULL,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )`).run();

    // Create montage_tasks
    db.prepare(`
    CREATE TABLE IF NOT EXISTS montage_tasks (
        id text PRIMARY KEY NOT NULL,
        montage_id text NOT NULL,
        title text NOT NULL,
        completed integer DEFAULT 0 NOT NULL,
        order_index integer,
        created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        updated_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        FOREIGN KEY (montage_id) REFERENCES montages(id) ON DELETE CASCADE
    )`).run();

    // Create montage_checklist_items
    db.prepare(`
    CREATE TABLE IF NOT EXISTS montage_checklist_items (
        id text PRIMARY KEY NOT NULL,
        montage_id text NOT NULL,
        template_id text NOT NULL,
        label text NOT NULL,
        allow_attachment integer DEFAULT 0 NOT NULL,
        completed integer DEFAULT 0 NOT NULL,
        order_index integer NOT NULL,
        attachment_id text,
        created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        updated_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
        FOREIGN KEY (montage_id) REFERENCES montages(id) ON DELETE CASCADE,
        FOREIGN KEY (attachment_id) REFERENCES montage_attachments(id) ON DELETE SET NULL
    )`).run();

    console.log('Tables created successfully.');
} catch (e) {
    console.error('Error creating tables:', e);
}
