import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { TasksList } from './_components/tasks-list';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    await requireUser();

    // Fetch All Montages with Tasks
    const allMontages = await db.query.montages.findMany({
        with: {
            tasks: true
        }
    });

    // Process data for the view
    const tasksMontages = allMontages
        .map(m => ({
            id: m.id,
            clientName: m.clientName,
            installationCity: m.installationCity,
            scheduledInstallationAt: m.scheduledInstallationAt,
            displayId: m.displayId,
            tasks: m.tasks.filter(t => !t.completed),
            pendingTasksCount: m.tasks.filter(t => !t.completed).length
        }))
        .filter(m => m.pendingTasksCount > 0)
        .sort((a, b) => {
             const dateA = a.scheduledInstallationAt ? new Date(a.scheduledInstallationAt).getTime() : Number.MAX_SAFE_INTEGER;
             const dateB = b.scheduledInstallationAt ? new Date(b.scheduledInstallationAt).getTime() : Number.MAX_SAFE_INTEGER;
             return dateA - dateB;
        });

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Centrum Zadań</h1>
                <p className="text-muted-foreground">
                    Zarządzaj zadaniami montażowymi w jednym miejscu.
                </p>
            </div>

            <TasksList tasksMontages={tasksMontages} />
        </div>
    );
}
