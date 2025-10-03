import { NextResponse } from "next/server";
import { upsertOrderEvent, deleteOrderEvent } from "@/lib/google-calendar";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderNoteHistory, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-session";
import { getProjectSettings } from "@/app/actions/project-settings";

// PATCH body can include any subset of fields below
const bodySchema = z.object({
  note: z.string().max(2000).optional(),
  preMeasurementSqm: z.number().int().positive().optional(),
  installerId: z.string().uuid().nullable().optional(),
  scheduledDate: z.number().int().positive().nullable().optional(),
  // Nowe pola dla zleceń typu montaż
  proposedInstallPriceCents: z.number().int().positive().nullable().optional(),
  buildingType: z.enum(["house", "apartment"]).nullable().optional(),
  desiredInstallFrom: z.number().int().positive().nullable().optional(),
  desiredInstallTo: z.number().int().positive().nullable().optional(),
  // Miejsce realizacji (opcjonalne dla obu typów)
  locationPostalCode: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  locationAddress: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const role = session?.user?.role as string | undefined;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Błąd walidacji", issues: parsed.error.issues },
        { status: 400 },
      );

    const update: Record<string, unknown> = {};
    const now = new Date();
    if (typeof parsed.data.preMeasurementSqm === "number") {
      update.preMeasurementSqm = parsed.data.preMeasurementSqm;
    }
    if (parsed.data.installerId !== undefined) {
      if (parsed.data.installerId === null) {
        update.installerId = null;
      } else {
        // verify installer role
        const [inst] = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.id, parsed.data.installerId))
          .limit(1);
        if (!inst)
          return NextResponse.json(
            { error: "Montażysta nie istnieje" },
            { status: 400 },
          );
        if (inst.role !== "installer")
          return NextResponse.json(
            { error: "Użytkownik nie jest montażystą" },
            { status: 400 },
          );
        update.installerId = parsed.data.installerId;
      }
    }
    if (typeof parsed.data.note === "string") {
      update.internalNote = parsed.data.note;
      update.internalNoteUpdatedAt = now;
      await db.insert(orderNoteHistory).values({
        id: crypto.randomUUID(),
        orderId: id,
        content: parsed.data.note,
        editedBy: session?.user?.email ?? null,
        editedAt: now,
      });
    }
    if (parsed.data.scheduledDate !== undefined) {
      if (parsed.data.scheduledDate === null) {
        update.scheduledDate = null;
      } else {
        // Drizzle column (timestamp_ms) expects a Date object in data layer
        const dt = new Date(parsed.data.scheduledDate);
        const normalizedDate = new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate(),
          0,
          0,
          0,
          0,
        );
        update.scheduledDate = normalizedDate;
      }
    }
    // Lokalizacja (adres realizacji)
    if (parsed.data.locationPostalCode !== undefined) {
      update.locationPostalCode = parsed.data.locationPostalCode;
    }
    if (parsed.data.locationCity !== undefined) {
      update.locationCity = parsed.data.locationCity;
    }
    if (parsed.data.locationAddress !== undefined) {
      update.locationAddress = parsed.data.locationAddress;
    }
    // Zaproponowana cena montażu (grosze)
    if (parsed.data.proposedInstallPriceCents !== undefined) {
      update.proposedInstallPriceCents = parsed.data.proposedInstallPriceCents;
    }
    // Typ budynku (dom/blok)
    if (parsed.data.buildingType !== undefined) {
      update.buildingType = parsed.data.buildingType;
    }
    // Preferowany przedział dat montażu (data-only)
    if (parsed.data.desiredInstallFrom !== undefined) {
      if (parsed.data.desiredInstallFrom === null) {
        update.desiredInstallFrom = null;
      } else {
        const dt = new Date(parsed.data.desiredInstallFrom);
        const normalized = new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate(),
          0,
          0,
          0,
          0,
        );
        update.desiredInstallFrom = normalized;
      }
    }
    if (parsed.data.desiredInstallTo !== undefined) {
      if (parsed.data.desiredInstallTo === null) {
        update.desiredInstallTo = null;
      } else {
        const dt = new Date(parsed.data.desiredInstallTo);
        const normalized = new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate(),
          0,
          0,
          0,
          0,
        );
        update.desiredInstallTo = normalized;
      }
    }
    if (Object.keys(update).length === 0)
      return NextResponse.json({ ok: true });
    await db.update(orders).set(update).where(eq(orders.id, id));

    // Stage 2: mirror to installation_slots removed. orders.scheduledDate is the single source of truth.
    // Google Calendar sync hooks — respect Automatyzacje ustawienia
    const settings = await getProjectSettings();
    if (update.scheduledDate === null || update.installerId === null) {
      if (settings.automations.autoDeleteGoogleEventOnUnassign) {
        await deleteOrderEvent({ orderId: id });
      }
    } else if (
      update.scheduledDate !== undefined ||
      update.installerId !== undefined ||
      update.preMeasurementSqm !== undefined ||
      update.internalNote !== undefined
    ) {
      await upsertOrderEvent({
        orderId: id,
        createIfMissing: settings.automations.autoCreateGoogleEventOnSchedule,
        updateIfExists: settings.automations.autoUpdateGoogleEventOnChange,
      });
    }
    // Revalidate details page and dashboard (upcoming orders)
    revalidatePath(`/zlecenia/${id}`);
    revalidatePath("/");
    // Also revalidate lists and installer dashboard views
    revalidatePath("/zlecenia");
    revalidatePath("/montaze");
    revalidatePath("/panel/montazysta");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/zlecenia/:id/montaz] Error", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
