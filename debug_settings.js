
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '/srv/panel/.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkSettings() {
    try {
        const result = await client`SELECT * FROM app_settings WHERE key = 'system_logo_url' OR key LIKE 'r2_%'`;
        console.log('Current Settings in DB:');
        result.forEach(row => {
            console.log(`${row.key}: ${row.value}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkSettings();
