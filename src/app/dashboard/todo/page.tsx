import { requireUser } from '@/lib/auth/session';
import { KanbanSquare } from 'lucide-react';
import { getBoardData } from './actions';
import { Board } from './_components/board';

export const dynamic = 'force-dynamic';

export default async function TodoPage() {
    await requireUser();
    const columns = await getBoardData();

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-6 md:p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <KanbanSquare className="h-8 w-8" />
                        Organizer Firmowy
                    </h1>
                    <p className="text-muted-foreground">
                        Twoje centrum dowodzenia: pomysły, zakupy, marketing i inne sprawy firmowe.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <Board initialColumns={columns} />
            </div>
        </div>
    );
}
