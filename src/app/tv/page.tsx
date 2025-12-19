import { TvBoard } from './_components/tv-board';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TV Dashboard',
    description: 'Widok telewizyjny dla hali produkcyjnej/biura',
};

export default function TvPage() {
    return (
        <main className="bg-slate-950 min-h-screen">
            <TvBoard />
        </main>
    );
}
