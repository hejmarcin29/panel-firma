import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Polecenie - Oferta Specjalna',
    description: 'Skorzystaj z oferty specjalnej z polecenia.',
};

export default function ReferralLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
