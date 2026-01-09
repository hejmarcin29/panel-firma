
import { db } from '@/lib/db';
import { users, montages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const email = 'architekt@architekt.pl';
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        console.log(`User ${email} not found`);
        return;
    }

    console.log(`User found: ${user.name} (${user.id})`);

    const userMontages = await db.query.montages.findMany({
        where: eq(montages.architectId, user.id),
        with: {
            customer: true
        }
    });

    console.log(`Found ${userMontages.length} montages for this architect.`);
    userMontages.forEach(m => {
        console.log(`- ID: ${m.id}, Client: ${m.clientName}, Status: ${m.status}, Created: ${m.createdAt}`);
        if(m.customer) {
            console.log(`  > Customer Relation: ${m.customer.name}`);
        }
    });
    
    process.exit(0);
}

main().catch(console.error);
