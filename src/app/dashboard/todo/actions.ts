'use server';

import { revalidatePath } from 'next/cache';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { boardColumns, boardTasks, taskAttachments } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { uploadTaskAttachmentObject } from '@/lib/r2/storage';

const TODO_PATH = '/dashboard/todo';

export async function getBoardData() {
    await requireUser();

    const columns = await db.query.boardColumns.findMany({
        orderBy: asc(boardColumns.orderIndex),
        with: {
            tasks: {
                orderBy: asc(boardTasks.orderIndex),
                with: {
                    attachments: true
                }
            },
        },
    });

    return columns;
}

export async function createColumn(title: string) {
    await requireUser();

    const existingColumns = await db.select().from(boardColumns);
    const newOrderIndex = existingColumns.length;

    await db.insert(boardColumns).values({
        id: crypto.randomUUID(),
        title,
        orderIndex: newOrderIndex,
    });

    revalidatePath(TODO_PATH);
}

export async function deleteColumn(columnId: string) {
    await requireUser();

    await db.delete(boardColumns).where(eq(boardColumns.id, columnId));
    revalidatePath(TODO_PATH);
}

export async function updateColumnTitle(columnId: string, title: string) {
    await requireUser();

    await db.update(boardColumns)
        .set({ title, updatedAt: new Date() })
        .where(eq(boardColumns.id, columnId));
    
    revalidatePath(TODO_PATH);
}

export async function createTask(columnId: string, content: string) {
    await requireUser();

    const existingTasks = await db.query.boardTasks.findMany({
        where: eq(boardTasks.columnId, columnId),
    });
    const newOrderIndex = existingTasks.length;

    await db.insert(boardTasks).values({
        id: crypto.randomUUID(),
        columnId,
        content,
        orderIndex: newOrderIndex,
    });

    revalidatePath(TODO_PATH);
}

export async function deleteTask(taskId: string) {
    await requireUser();

    await db.delete(boardTasks).where(eq(boardTasks.id, taskId));
    revalidatePath(TODO_PATH);
}

export async function updateTaskContent(taskId: string, content: string, description?: string) {
    await requireUser();

    await db.update(boardTasks)
        .set({ 
            content, 
            description,
            updatedAt: new Date() 
        })
        .where(eq(boardTasks.id, taskId));

    revalidatePath(TODO_PATH);
}

export async function toggleTaskCompletion(taskId: string, completed: boolean) {
    await requireUser();

    await db.update(boardTasks)
        .set({ 
            completed,
            updatedAt: new Date() 
        })
        .where(eq(boardTasks.id, taskId));

    revalidatePath(TODO_PATH);
}

export async function moveTask(taskId: string, newColumnId: string, newIndex: number) {
    await requireUser();

    // This is a simplified version. In a real app, you'd handle reordering all other items.
    // For now, we just update the column and let the UI handle the optimistic update,
    // but for persistence we should ideally shift other items.
    // To keep it simple and robust for this iteration:
    
    await db.update(boardTasks)
        .set({ 
            columnId: newColumnId, 
            orderIndex: newIndex,
            updatedAt: new Date() 
        })
        .where(eq(boardTasks.id, taskId));

    revalidatePath(TODO_PATH);
}

export async function updateColumnOrder(columnId: string, newIndex: number) {
    await requireUser();

    await db.update(boardColumns)
        .set({ orderIndex: newIndex, updatedAt: new Date() })
        .where(eq(boardColumns.id, columnId));
    
    revalidatePath(TODO_PATH);
}

export async function reorderColumns(items: { id: string; orderIndex: number }[]) {
    await requireUser();
    
    // Use a transaction or Promise.all for better performance
    await Promise.all(
        items.map((item) => 
            db.update(boardColumns)
                .set({ orderIndex: item.orderIndex })
                .where(eq(boardColumns.id, item.id))
        )
    );

    revalidatePath(TODO_PATH);
}

export async function reorderTasks(items: { id: string; orderIndex: number; columnId: string }[]) {
    await requireUser();

    await Promise.all(
        items.map((item) => 
            db.update(boardTasks)
                .set({ 
                    orderIndex: item.orderIndex,
                    columnId: item.columnId
                })
                .where(eq(boardTasks.id, item.id))
        )
    );

    revalidatePath(TODO_PATH);
}

export async function updateTaskDates(taskId: string, dueDate: Date | null, reminderAt: Date | null) {
    await requireUser();

    await db.update(boardTasks)
        .set({ 
            dueDate,
            reminderAt,
            updatedAt: new Date() 
        })
        .where(eq(boardTasks.id, taskId));

    revalidatePath(TODO_PATH);
}

export async function uploadTaskAttachment(formData: FormData) {
    await requireUser();

    const taskId = formData.get('taskId') as string;
    const file = formData.get('file') as File;

    if (!taskId || !file) {
        throw new Error('Missing taskId or file');
    }

    const uploaded = await uploadTaskAttachmentObject({ file });

    await db.insert(taskAttachments).values({
        id: crypto.randomUUID(),
        taskId,
        fileUrl: uploaded.url,
        fileName: file.name,
        fileType: file.type,
    });

    revalidatePath(TODO_PATH);
}
