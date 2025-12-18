import { CreateMontageForm } from '../_components/create-montage-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';

export default async function NewMontagePage() {
    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            roles: true,
        }
    });

    const installers = allUsers.filter(u => u.roles?.includes('installer') || u.roles?.includes('admin'));
    const measurers = allUsers.filter(u => u.roles?.includes('measurer') || u.roles?.includes('admin'));
    
    const leads = await db.query.montages.findMany({
        where: and(
            eq(montages.status, 'lead'),
            isNull(montages.deletedAt)
        ),
        orderBy: desc(montages.createdAt),
        columns: {
            id: true,
            clientName: true,
            displayId: true,
            createdAt: true,
            contactPhone: true,
            address: true,
            materialDetails: true,
        }
    });

    return (
        <div className="container mx-auto py-6 max-w-3xl">
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/dashboard/montaze">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Powrót do listy
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Dodaj nowy montaż</h1>
                <p className="text-muted-foreground mt-1">
                    Uzupełnij dane kontaktowe, adresowe oraz materiały. Lista kontrolna zostanie dodana automatycznie.
                </p>
            </div>
            <CreateMontageForm installers={installers} measurers={measurers} leads={leads} />
        </div>
    );
}
