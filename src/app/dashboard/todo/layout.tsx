import { requireUser } from '@/lib/auth/session';
import { getBoardData } from './actions';
import { TodoSidebar } from './_components/todo-sidebar';

export default async function TodoLayout({ children }: { children: React.ReactNode }) {
    await requireUser();
    const { columns } = await getBoardData();

    return (
        <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden md:block w-80 border-r bg-background shrink-0">
                <TodoSidebar columns={columns} className="h-full" />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
                {children}
            </div>
        </div>
    );
}
