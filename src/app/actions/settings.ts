"use server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const dailyGoalSchema = z.object({
  dailyGoal: z
    .string()
    .trim()
    .regex(/^\d+$/, "Tylko liczby")
    .transform((v) => parseInt(v, 10))
    .refine((v) => v > 0 && v <= 100, "Podaj liczbę 1–100"),
});

export async function saveDailyGoal(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }>{
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = dailyGoalSchema.parse({ dailyGoal: String(raw.dailyGoal ?? "") });
    const key = "daily_goal";
    const rows = await db
      .select({ v: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    if (rows.length === 0) {
      await db.insert(appSettings).values({ key, value: String(parsed.dailyGoal) });
    } else {
      await db.update(appSettings).set({ value: String(parsed.dailyGoal) }).where(eq(appSettings.key, key));
    }
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Błąd zapisu";
    return { ok: false, error: msg };
  }
}
