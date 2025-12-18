'use server';

import { requireUser } from '@/lib/auth/session';
import { getAssignedProducts } from '@/app/dashboard/products/actions';
import { LeadForm } from './_components/lead-form';

export default async function NewLeadPage() {
    const user = await requireUser();
    
    // Fetch assigned products if user is an architect
    let assignedProducts: { id: number; name: string }[] = [];
    if (user.roles.includes('architect')) {
        assignedProducts = await getAssignedProducts(user.id);
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Zgłoś nowy temat</h1>
                <p className="text-muted-foreground">
                    Wypełnij formularz, aby przekazać nam szczegóły nowego zlecenia.
                </p>
            </div>
            
            <LeadForm 
                assignedProducts={assignedProducts} 
                userId={user.id}
                isArchitect={user.roles.includes('architect')}
            />
        </div>
    );
}
