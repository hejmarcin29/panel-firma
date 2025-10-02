"use server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import {
  mergeProjectSettings,
  projectSettingsSchema,
  type ProjectSettings,
} from "@/lib/project-settings";

const KEY = "project_settings";

export async function getProjectSettings(): Promise<ProjectSettings> {
  const rows = await db
    .select({ v: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, KEY))
    .limit(1);
  if (rows.length === 0) return mergeProjectSettings();
  try {
    const parsed = JSON.parse(rows[0].v) as unknown;
    const data = projectSettingsSchema.partial().parse(parsed);
    return mergeProjectSettings(data);
  } catch {
    return mergeProjectSettings();
  }
}

const updateSchema = projectSettingsSchema.partial();

export async function updateProjectSettings(
  input: z.infer<typeof updateSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.role || session.user.role !== "admin") {
    return { ok: false, error: "Brak uprawnień" };
  }
  try {
    const toSave = updateSchema.parse(input);
    const current = await getProjectSettings();
    // Validate unique stage keys within each section only, and only if user explicitly provided pipelineStages
    const providedPipelineStages = Object.prototype.hasOwnProperty.call(
      input ?? {},
      "pipelineStages",
    );
    if (providedPipelineStages && toSave.pipelineStages) {
      const unique = (arr: { key: string; label: string }[]) => {
        const seen = new Set<string>();
        for (const e of arr) {
          if (seen.has(e.key)) return e.key;
          seen.add(e.key);
        }
        return null as string | null;
      };
      const dupDelivery = unique(toSave.pipelineStages.delivery ?? []);
      if (dupDelivery) return { ok: false, error: `Duplikat klucza etapu (Dostawa): ${dupDelivery}` };
      const dupInstallation = unique(toSave.pipelineStages.installation ?? []);
      if (dupInstallation) return { ok: false, error: `Duplikat klucza etapu (Montaż): ${dupInstallation}` };
    }
  const merged = mergeProjectSettings({ ...current, ...toSave });
    const payload = JSON.stringify(merged);
    const rows = await db
      .select({ v: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, KEY))
      .limit(1);
    if (rows.length === 0) {
      await db.insert(appSettings).values({ key: KEY, value: payload });
    } else {
      await db
        .update(appSettings)
        .set({ value: payload })
        .where(eq(appSettings.key, KEY));
    }
    revalidatePath("/ustawienia/checklisty");
    revalidatePath("/ustawienia/etapy");
    revalidatePath("/ustawienia/automatyzacje");
    revalidatePath("/zlecenia");
    revalidatePath("/klienci");
  revalidatePath("/dostawy");
  revalidatePath("/montaze");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Błąd zapisu";
    return { ok: false, error: msg };
  }
}
