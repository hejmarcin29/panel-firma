import { getReferrerByCode } from './actions';
import { LeadForm } from './_components/lead-form';

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function ReferralLandingPage({ params }: PageProps) {
    const { code } = await params;
    const referrer = await getReferrerByCode(code);

    if (!referrer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900">Ups!</h1>
                    <p className="text-lg text-gray-600">Nie znaleziono takiego kodu polecającego.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 flex flex-col">
            {/* Header / Logo Area */}
            <header className="w-full py-8 flex justify-center">
                <div className="text-2xl font-bold tracking-tight text-gray-900">
                    PRIME <span className="text-primary">PODŁOGA</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 pb-20">
                <LeadForm 
                    referralCode={code} 
                    referrerName={referrer.name} 
                />
            </main>
        </div>
    );
}
