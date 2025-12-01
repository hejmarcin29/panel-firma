import { requireUser } from '@/lib/auth/session';
import { CheckSquare } from 'lucide-react';
import { getBoardData } from './actions';
import { TodoLists } from './_components/todo-lists';

export const dynamic = 'force-dynamic';

export default async function TodoPage() {
    await requireUser();
    const columns = await getBoardData();

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <CheckSquare className="h-8 w-8" />
                        Focus List
                    </h1>
                    <p className="text-muted-foreground">
                        Twoje centrum dowodzenia: pomysły, zakupy, marketing i inne sprawy firmowe.
                    </p>
                </div>
            </div>

            <div className="flex-1">
                <TodoLists initialColumns={columns} />
            </div>
        </div>
    );
}
