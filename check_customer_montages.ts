
import 'dotenv/config';
import { db } from './src/lib/db';
import { customers, montages } from './src/lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';

async function check() {
    console.log('Checking customers with tokens...');
    const customersWithTokens = await db.query.customers.findMany({
        where: isNotNull(customers.referralToken),
        with: {
            montages: true
        }
    });

    console.log(`Found ${customersWithTokens.length} customers with tokens.`);

    for (const c of customersWithTokens) {
        console.log(`Customer: ${c.name} (${c.id})`);
        console.log(`Token: ${c.referralToken}`);
        console.log(`Montages count: ${c.montages.length}`);
        if (c.montages.length > 0) {
            c.montages.forEach(m => {
                console.log(` - Montage: ${m.id}, Status: ${m.status}, ClientName: ${m.clientName}`);
            });
        } else {
            // Check if there are montages that SHOULD be linked but aren't
            // Maybe linked by email?
            if (c.email) {
                const montagesByEmail = await db.query.montages.findMany({
                    where: eq(montages.contactEmail, c.email)
                });
                console.log(`   (Found ${montagesByEmail.length} montages by email ${c.email} that might be unlinked)`);
                montagesByEmail.forEach(m => {
                     console.log(`    - Potential match: ${m.id}, CustomerID: ${m.customerId}`);
                });
            }
        }
        console.log('---');
    }
}

check().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
