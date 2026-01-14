import 'dotenv/config';
import { db } from './src/lib/db';
import { erpCategories } from './src/lib/db/schema';

async function main() {
    const cats = await db.select().from(erpCategories);
    console.log(JSON.stringify(cats, null, 2));
}

main().catch(console.error);
