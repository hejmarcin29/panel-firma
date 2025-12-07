import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TasksList } from './_components/tasks-list';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const user = await requireUser();
    const canSeeAll = user.roles.includes('admin') || user.roles.includes('measurer');

    // Fetch Montages with Tasks
    const allMontages = await db.query.montages.findMany({
        where: !canSeeAll ? eq(montages.installerId, user.id) : undefined,
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
            scheduledInstallationAt: m.scheduledInstallationAt || m.forecastedInstallationDate,
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
                <h1 className="text-3xl font-bold tracking-tight">Zadania Montażowe</h1>
                <p className="text-muted-foreground">
                    Zarządzaj zadaniami przypisanymi do konkretnych montaży.
                </p>
                <p className="text-xs text-muted-foreground/80 bg-muted/50 p-2 rounded-md border border-border/50 max-w-max">
                    ℹ️ Terminy zadań (Pilne, Na dziś, Ten tydzień) wynikają z daty montażu ustawionej w szczegółach zlecenia.
                </p>
            </div>

            <TasksList tasksMontages={tasksMontages} />
        </div>
    );
}
