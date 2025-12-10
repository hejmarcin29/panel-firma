import { CreateMontageForm } from '../_components/create-montage-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export default async function NewMontagePage() {
    const installers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(sql`${users.roles}::text LIKE '%"installer"%'`);
    const measurers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(sql`${users.roles}::text LIKE '%"measurer"%'`);

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
            <CreateMontageForm installers={installers} measurers={measurers} />
        </div>
    );
}
