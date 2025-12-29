
/* eslint-disable @typescript-eslint/no-require-imports */
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
  console.log('Checking for "estimated_floor_area" column...');
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'montages' AND column_name = 'estimated_floor_area'
    `;

    if (columns.length > 0) {
      console.log('Column "estimated_floor_area" already exists.');
      return;
    }

    console.log('Adding "estimated_floor_area" column...');
    await sql`
      ALTER TABLE "montages" ADD COLUMN "estimated_floor_area" double precision
    `;
    console.log('Column added successfully.');
  } catch (error) {
    console.error('Error ensuring column exists:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
