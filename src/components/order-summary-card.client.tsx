"use client";
import { TypeBadge, StatusBadge, OutcomeBadge } from "@/components/badges";
import { QuickChecklistBar } from "@/components/quick-checklist-bar.client";
import { OrderOutcomeButtons } from "@/components/order-outcome-buttons.client";
import { OrderArchiveButton } from "@/components/order-archive-button.client";
import { pl } from "@/i18n/pl";
import Link from "next/link";
import { formatDate } from "@/lib/date";

type Props = {
  id: string;
  type: "delivery" | "installation";
  status: string;
  outcome: "won" | "lost" | null;
  createdAt: number;
  orderNo?: string | null;
  flags?: Record<string, boolean>;
};

export function OrderSummaryCard({
  id,
  type,
  status,
  outcome,
  createdAt,
  orderNo,
  flags,
}: Props) {
  const items = Object.entries(flags ?? {}).map(([key, done]) => ({
    key,
    label: key,
    done: Boolean(done),
  }));
  const statusLabel =
    (pl.orders.statuses as Record<string, string>)[status] || status;
  const href = orderNo
    ? `/zlecenia/nr/${orderNo}_${type === "installation" ? "m" : "d"}`
    : `/zlecenia/${id}`;
  return (
    <div className="group rounded-xl border border-black/10 p-3 shadow-sm transition hover:shadow-md dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <TypeBadge type={type} />
          {orderNo ? (
            <span className="text-xs opacity-70">
              Nr:{" "}
              <span className="font-mono">{`${orderNo}_${type === "installation" ? "m" : "d"}`}</span>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <OutcomeBadge outcome={outcome} />
          <StatusBadge status={status} label={statusLabel} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <QuickChecklistBar orderId={id} type={type} items={items} />
        <div className="flex items-center gap-2 opacity-100">
          <OrderOutcomeButtons id={id} outcome={outcome} />
          <OrderArchiveButton id={id} />
          <Link
            href={href}
            className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Szczegóły
          </Link>
        </div>
      </div>

      <div className="mt-2 text-xs opacity-60 flex items-center justify-between">
        <span>{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
