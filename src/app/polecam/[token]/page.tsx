import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReferralForm } from './_components/referral-form';
import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
    const { token } = await params;
    const partner = await db.query.users.findFirst({
        where: eq(users.referralToken, token),
    });

    return {
        title: partner ? `Polecam - ${partner.name}` : 'Polecam',
    };
}

export default async function ReferralPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    const partner = await db.query.users.findFirst({
        where: eq(users.referralToken, token),
    });

    if (!partner) {
        notFound();
    }

    return (
        <div className="bg-card border rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Oferta Specjalna</h1>
                <p className="text-muted-foreground">
                    Jesteś tu z polecenia firmy <span className="font-semibold text-primary">{partner.name}</span>.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Zostaw kontakt, a przygotujemy dla Ciebie darmową wycenę.
                </p>
            </div>

            <ReferralForm token={token} />
        </div>
    );
}
