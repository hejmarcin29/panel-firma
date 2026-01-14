import { db } from "@/lib/db";
import { erpOrderTimeline } from "@/lib/db/schema";
import { TimelineType } from "@/lib/db/reviews-schema";
import { randomUUID } from "crypto";

export async function logOrderEvent(
    orderId: string,
    type: TimelineType,
    title: string,
    metadata?: Record<string, unknown>
) {
    try {
        await db.insert(erpOrderTimeline).values({
            id: randomUUID(),
            orderId,
            type,
            title,
            metadata,
        });
        console.log(`[Timeline] Logged event for order ${orderId}: ${title}`);
    } catch (e) {
        console.error(`[Timeline] Failed to log event for order ${orderId}:`, e);
        // We do not throw here to avoid blocking main business logic if logging fails
    }
}
