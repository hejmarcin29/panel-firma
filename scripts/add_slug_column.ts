
import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
    try {
        console.log("Adding slug column to erp_products...");
        await sql`ALTER TABLE erp_products ADD COLUMN IF NOT EXISTS slug text UNIQUE;`;
        console.log("Success! Column added.");
    } catch (error: any) {
        console.error("Error adding column:", error.message);
    } finally {
        await sql.end();
    }
}

main();
