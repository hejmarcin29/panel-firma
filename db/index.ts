import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/panel.db";

const client = createClient({ url: databaseUrl });

export const db = drizzle(client);
