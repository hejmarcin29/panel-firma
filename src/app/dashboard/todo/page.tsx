import { requireUser } from '@/lib/auth/session';
import { getBoardData } from './actions';
import { TodoSidebar } from './_components/todo-sidebar';

export const dynamic = 'force-dynamic';

export default async function TodoPage() {
    await requireUser();
    const { columns } = await getBoardData();

    return (
        <>
            {/* Mobile: Show Sidebar (as the main content) */}
            <div className="md:hidden h-full bg-background">
                <TodoSidebar columns={columns} className="h-full border-none" />
            </div>
            
            {/* Desktop: Show Empty State */}
            <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                    <h3 className="font-semibold text-lg">Wybierz listę</h3>
                    <p className="text-sm">Wybierz listę z menu po lewej stronie, aby zobaczyć zadania.</p>
                </div>
            </div>
        </>
    );
}
