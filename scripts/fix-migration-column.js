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
  console.log('Attempting to fix "measurement_additional_materials" column type...');
  try {
    // Check if column exists and its type
    const columns = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'montages' AND column_name = 'measurement_additional_materials'
    `;

    if (columns.length === 0) {
      console.log('Column "measurement_additional_materials" does not exist. Skipping.');
      return;
    }

    const currentType = columns[0].data_type;
    console.log(`Current column type: ${currentType}`);

    if (currentType === 'json') {
      console.log('Column is already type json. Skipping.');
      return;
    }

    console.log('Converting column to json...');
    await sql`
      ALTER TABLE "montages" 
      ALTER COLUMN "measurement_additional_materials" 
      TYPE json 
      USING CASE 
        WHEN measurement_additional_materials IS NULL OR measurement_additional_materials = '' THEN NULL 
        ELSE json_build_array(json_build_object('id', 'migrated', 'name', measurement_additional_materials, 'quantity', '', 'supplySide', 'installer')) 
      END
    `;
    console.log('Migration fix applied successfully.');
  } catch (error) {
    console.error('Error applying fix:', error);
    // Don't exit with error, let the deploy script continue and potentially fail at push if this didn't work
    // But if this failed, push will definitely fail.
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
