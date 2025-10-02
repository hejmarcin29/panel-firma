import { db } from "@/db";
import {
  clients,
  orders,
  users,
  orderChecklistItems,
  clientNotes,
  deliverySlots,
} from "@/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { pl } from "@/i18n/pl";
import { OrderEditor } from "@/components/order-editor.client";
import { OrderOutcomeButtons } from "@/components/order-outcome-buttons.client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/back-button";
import {
  TypeBadge,
  OutcomeBadge,
  PipelineStageBadge,
} from "@/components/badges";
import { getSession } from "@/lib/auth-session";
import { OrderPipelineList } from "@/components/order-pipeline-list.client";
import { OrderChecklist } from "@/components/order-checklist.client";
import { QuickChecklistBar } from "@/components/quick-checklist-bar.client";
import { OrderArchiveButton } from "@/components/order-archive-button.client";
import { OrderUnarchiveButton } from "@/components/order-unarchive-button.client";
import { OrderOutcomeRevertButton } from "@/components/order-outcome-revert-button.client";
import { formatDate } from "@/lib/date";
import { formatInvoiceLine, formatCityPostalAddress } from "@/lib/address";
import { DeliveryItems } from "@/components/delivery-items.client";
import { KeyValueRow, BreakableText } from "@/components/ui/key-value-row";
import { GenerateOrderPreviewLinkButton } from "@/components/generate-order-preview-link.client";
import { redirect } from "next/navigation";
import { OrderPrivateActions } from "@/components/order-private-actions.client";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";
  const isInstaller = session?.user?.role === "installer";
  const [row] = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      pipelineStage: orders.pipelineStage,
      outcome: orders.outcome,
      outcomeAt: orders.outcomeAt,
      archivedAt: orders.archivedAt,
      clientId: orders.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      clientInvoiceCity: clients.invoiceCity,
      clientInvoicePostalCode: clients.invoicePostalCode,
      clientInvoiceAddress: clients.invoiceAddress,
      locationCity: orders.locationCity,
      locationPostalCode: orders.locationPostalCode,
      locationAddress: orders.locationAddress,
      installerId: orders.installerId,
      installerName: users.name,
      installerEmail: users.email,
      preMeasurementSqm: orders.preMeasurementSqm,
      scheduledDate: orders.scheduledDate,
      proposedInstallPriceCents: orders.proposedInstallPriceCents,
      buildingType: orders.buildingType,
      desiredInstallFrom: orders.desiredInstallFrom,
      desiredInstallTo: orders.desiredInstallTo,
      createdAt: orders.createdAt,
      orderNo: orders.orderNo,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-sm text-red-600">{pl.orders.notFound}</div>
        <div className="mt-4">
          <Link
            href="/"
            className="hover:underline focus:underline focus:outline-none"
          >
            Powrót
          </Link>
        </div>
      </div>
    );
  }

  if (row.type !== "installation") {
    redirect(`/dostawa/${row.id}`);
  }

  const latestDelivery = await db
    .select({ id: deliverySlots.id })
    .from(deliverySlots)
    .where(
      and(
        eq(deliverySlots.orderId, row.id),
        isNotNull(deliverySlots.plannedAt),
      ),
    )
    .orderBy(desc(deliverySlots.plannedAt))
    .limit(1);

  const checklist = await db
    .select({ key: orderChecklistItems.key, done: orderChecklistItems.done })
    .from(orderChecklistItems)
    .where(eq(orderChecklistItems.orderId, row.id));

  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, row.clientId))
    .orderBy(desc(clientNotes.createdAt));

  return (
    <div className="mx-auto max-w-none p-0 md:max-w-6xl md:p-6 space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)]"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            background:
              "radial-gradient(1200px 420px at -10% -20%, color-mix(in oklab, var(--pp-primary) 16%, transparent), transparent 40%), linear-gradient(120deg, color-mix(in oklab, var(--pp-primary) 10%, transparent), transparent 65%)",
          }}
        />
        <div className="relative z-10 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BackButton fallbackHref="/montaz" />
                <h1 className="truncate text-2xl md:text-3xl font-semibold">
                  Zlecenie #
                  {row.orderNo
                    ? `${row.orderNo}_${row.type === "installation" ? "m" : "d"}`
                    : row.id.slice(0, 8)}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <TypeBadge type={row.type} />
                <PipelineStageBadge stage={row.pipelineStage} />
                <OutcomeBadge
                  outcome={row.outcome as "won" | "lost" | null | undefined}
                />
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <span className="opacity-70">Klient:</span>
                <Link
                  className="hover:underline focus:underline focus:outline-none"
                  href={`/klienci/${row.clientId}`}
                >
                  {row.clientName || row.clientId}
                </Link>
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <span className="opacity-70">Utworzono:</span>
                <span>{formatDate(row.createdAt)}</span>
              </div>
              <div
                className="mt-3 rounded-md border p-3 text-sm min-w-0"
                style={{ borderColor: "var(--pp-border)" }}
              >
                <div className="text-xs font-medium opacity-70 mb-2">
                  Podstawowe dane klienta
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <KeyValueRow label="Nazwa" labelClassName="basis-auto w-auto pr-3">
                    <BreakableText>{row.clientName || row.clientId}</BreakableText>
                  </KeyValueRow>
                  <KeyValueRow label="Telefon" labelClassName="basis-auto w-auto pr-3">
                    {row.clientPhone ? (
                      <a
                        href={`tel:${row.clientPhone}`}
                        className="hover:underline break-words break-all focus:underline focus:outline-none"
                      >
                        {row.clientPhone}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </KeyValueRow>
                  <KeyValueRow label="Email" labelClassName="basis-auto w-auto pr-3">
                    {row.clientEmail ? (
                      <a
                        href={`mailto:${row.clientEmail}`}
                        className="hover:underline break-words break-all focus:underline focus:outline-none"
                      >
                        {row.clientEmail}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </KeyValueRow>
                  <KeyValueRow label="Faktura" labelClassName="basis-auto w-auto pr-3">
                    <BreakableText>
                      {formatInvoiceLine(row.clientInvoicePostalCode, row.clientInvoiceCity, row.clientInvoiceAddress)}
                    </BreakableText>
                  </KeyValueRow>
                  <KeyValueRow label="Miejsce realizacji" labelClassName="basis-auto w-auto pr-3">
                    <BreakableText>
                      {formatCityPostalAddress(row.locationCity, row.locationPostalCode, row.locationAddress)}
                    </BreakableText>
                  </KeyValueRow>
                  <div>
                    <Link
                      href={`/klienci/${row.clientId}`}
                      className="text-xs hover:underline focus:underline focus:outline-none"
                    >
                      Wejdź do klienta
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              {isAdmin ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!row.outcome ? (
                    <OrderOutcomeButtons
                      id={row.id}
                      outcome={row.outcome as "won" | "lost" | null}
                    />
                  ) : (
                    <OrderOutcomeRevertButton id={row.id} />
                  )}
                  {row.archivedAt ? (
                    <OrderUnarchiveButton id={row.id} />
                  ) : (
                    <OrderArchiveButton id={row.id} />
                  )}
                  <GenerateOrderPreviewLinkButton orderId={row.id} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Etap i checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickChecklistBar
                orderId={row.id}
                type={row.type as "delivery" | "installation"}
                items={checklist.map((i) => ({ ...i, label: i.key }))}
              />
              <OrderPipelineList
                type={row.type as "delivery" | "installation"}
                stage={row.pipelineStage}
              />
              <OrderChecklist
                orderId={row.id}
                type={row.type as "delivery" | "installation"}
                items={checklist}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card id="order-info" className="scroll-mt-16">
            <CardHeader className="pb-2">
              <CardTitle>Podstawowe informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <KeyValueRow label="Klient">
                <BreakableText>{row.clientName || row.clientId}</BreakableText>
              </KeyValueRow>
              {row.type === "installation" && (
                <KeyValueRow label="m2 przed pomiarem">
                  {row.preMeasurementSqm ?? "-"}
                </KeyValueRow>
              )}
              <KeyValueRow label="Planowana data">
                {row.scheduledDate ? formatDate(row.scheduledDate) : "-"}
              </KeyValueRow>
              {row.type === "installation" ? (
                <>
                  <KeyValueRow label="Proponowana cena montażu">
                    {typeof row.proposedInstallPriceCents === "number"
                      ? `${(row.proposedInstallPriceCents / 100).toFixed(2)} zł`
                      : "-"}
                  </KeyValueRow>
                  <KeyValueRow label="Dom czy blok?">
                    {row.buildingType === "house"
                      ? "Dom"
                      : row.buildingType === "apartment"
                        ? "Blok"
                        : "-"}
                  </KeyValueRow>
                  <KeyValueRow label="Preferowany termin montażu">
                    {row.desiredInstallFrom || row.desiredInstallTo
                      ? `${row.desiredInstallFrom ? formatDate(row.desiredInstallFrom) : "?"} — ${row.desiredInstallTo ? formatDate(row.desiredInstallTo) : "?"}`
                      : "-"}
                  </KeyValueRow>
                </>
              ) : null}
              {row.type === "installation" && (
                <KeyValueRow label="Montażysta">
                  <BreakableText>
                    {row.installerName || row.installerEmail || "-"}
                  </BreakableText>
                </KeyValueRow>
              )}
              <KeyValueRow label="Utworzono">
                {formatDate(row.createdAt)}
              </KeyValueRow>
              {row.outcome && (
                <KeyValueRow label="Wynik">
                  {row.outcome === "won" ? "Wygrane" : "Przegrane"}{" "}
                  {row.outcomeAt ? `(${formatDate(row.outcomeAt)})` : ""}
                </KeyValueRow>
              )}
              <div
                className="pt-2 border-t"
                style={{ borderColor: "var(--pp-border)" }}
              >
                <OrderEditor
                  orderId={row.id}
                  type={row.type as "delivery" | "installation"}
                  defaults={{
                    note: null,
                    preMeasurementSqm: row.preMeasurementSqm,
                    installerId: row.installerId ?? null,
                    scheduledDate: row.scheduledDate
                      ? ((row.scheduledDate as unknown as Date).getTime?.() ??
                        Number(row.scheduledDate))
                      : null,
                    proposedInstallPriceCents: (typeof row.proposedInstallPriceCents === "number"
                      ? row.proposedInstallPriceCents
                      : null),
                    buildingType:
                      row.buildingType === "house" || row.buildingType === "apartment"
                        ? row.buildingType
                        : null,
                    desiredInstallFrom: row.desiredInstallFrom
                      ? ((row.desiredInstallFrom as unknown as Date).getTime?.() ?? Number(row.desiredInstallFrom))
                      : null,
                    desiredInstallTo: row.desiredInstallTo
                      ? ((row.desiredInstallTo as unknown as Date).getTime?.() ?? Number(row.desiredInstallTo))
                      : null,
                    locationPostalCode: (() => {
                      const anyRow = row as unknown as Record<string, unknown>;
                      return typeof anyRow.locationPostalCode === "string" ? anyRow.locationPostalCode : null;
                    })(),
                    locationCity: (() => {
                      const anyRow = row as unknown as Record<string, unknown>;
                      return typeof anyRow.locationCity === "string" ? anyRow.locationCity : null;
                    })(),
                    locationAddress: (() => {
                      const anyRow = row as unknown as Record<string, unknown>;
                      return typeof anyRow.locationAddress === "string" ? anyRow.locationAddress : null;
                    })(),
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {latestDelivery?.[0]?.id ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pozycje dostawy</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryItems orderId={row.id} slotId={latestDelivery[0].id} />
              </CardContent>
            </Card>
          ) : null}

          {isInstaller ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Prywatne (montażysta)</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderPrivateActions orderId={row.id} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{pl.clients.notesTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="text-sm opacity-70">{pl.clients.noNotes}</div>
              ) : (
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded border border-black/10 p-2 dark:border-white/10"
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {n.content}
                      </div>
                      <div className="text-xs opacity-60 mt-1">
                        {formatDate(n.createdAt)}{" "}
                        {n.createdBy ? `• ${n.createdBy}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
