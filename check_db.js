const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString);

const sql = postgres(connectionString);

async function test() {
  try {
    const result = await sql`SELECT 1 as res`;
    console.log('Connection successful:', result);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await sql.end();
  }
}

test();
