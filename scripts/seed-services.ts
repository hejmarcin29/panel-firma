
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const baseServices = [
    { id: 'svc_montaz_deska_klik', name: 'Montaż Deska (Klik)', unit: 'm2', baseInstallerRate: 35 },
    { id: 'svc_montaz_deska_klej', name: 'Montaż Deska (Klej)', unit: 'm2', baseInstallerRate: 45 },
    { id: 'svc_montaz_jodelka_klik', name: 'Montaż Jodełka (Klik)', unit: 'm2', baseInstallerRate: 50 },
    { id: 'svc_montaz_jodelka_klej', name: 'Montaż Jodełka (Klej)', unit: 'm2', baseInstallerRate: 65 },
];

async function main() {
    console.log('Seeding services...');
    for (const svc of baseServices) {
        const existing = await db.query.services.findFirst({
            where: eq(services.id, svc.id)
        });

        if (!existing) {
            await db.insert(services).values({
                id: svc.id,
                name: svc.name,
                unit: svc.unit,
                baseInstallerRate: svc.baseInstallerRate,
            });
            console.log(`Created service: ${svc.name}`);
        } else {
            console.log(`Service exists: ${svc.name}`);
        }
    }
    console.log('Done.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
