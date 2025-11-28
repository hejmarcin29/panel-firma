import { db } from '@/lib/db';
import { systemLogs } from '@/lib/db/schema';

export async function logSystemEvent(
    action: string,
    details: string | object,
    userId?: string | null
) {
    try {
        await db.insert(systemLogs).values({
            id: crypto.randomUUID(),
            action,
            details: typeof details === 'string' ? details : JSON.stringify(details),
            userId: userId ?? null,
        });
    } catch (error) {
        console.error('Failed to log system event:', error);
    }
}
