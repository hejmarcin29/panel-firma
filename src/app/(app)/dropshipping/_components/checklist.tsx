"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { cn } from "@/lib/utils";

import { toggleChecklistItemAction } from "../actions";

interface ChecklistItemProps {
  orderId: number;
  item: {
    id: number;
    title: string;
    description: string | null;
    isOptional: boolean;
    isCompleted: boolean;
    completedAt: Date | null;
  };
}

function ChecklistItem({ orderId, item }: ChecklistItemProps) {
  const [isCompleted, setIsCompleted] = useState(item.isCompleted);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const Icon = pending ? Loader2 : isCompleted ? CheckCircle2 : Circle;
  const iconClasses = cn(
    "h-5 w-5",
    pending ? "animate-spin text-muted-foreground" : isCompleted ? "text-emerald-500" : "text-muted-foreground",
  );

  return (
    <button
      type="button"
      onClick={() => {
        const next = !isCompleted;
        setIsCompleted(next);
        setError(null);
        startTransition(async () => {
          const formData = new FormData();
          formData.append("orderId", String(orderId));
          formData.append("itemId", String(item.id));
          const result = await toggleChecklistItemAction(formData);
          if (result?.error) {
            setIsCompleted(!next);
            setError(result.error);
          }
        });
      }}
      className="flex w-full items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition hover:border-muted/70 hover:bg-muted/40"
      disabled={pending}
    >
      <Icon className={iconClasses} />
      <span className="flex flex-1 flex-col">
        <span className="font-medium leading-tight">
          {item.title}
          {item.isOptional ? <span className="ml-2 text-xs uppercase text-muted-foreground">Opcjonalne</span> : null}
        </span>
        {item.description ? (
          <span className="mt-1 text-sm text-muted-foreground">{item.description}</span>
        ) : null}
        {item.completedAt ? (
          <span className="mt-2 text-xs text-muted-foreground">
            Zrealizowano {new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(item.completedAt)}
          </span>
        ) : null}
        {error ? <span className="mt-2 text-xs text-destructive">{error}</span> : null}
      </span>
    </button>
  );
}

interface ChecklistProps {
  orderId: number;
  items: {
    id: number;
    title: string;
    description: string | null;
    isOptional: boolean;
    isCompleted: boolean;
    completedAt: Date | null;
  }[];
}

export function Checklist({ orderId, items }: ChecklistProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak checklisty dla tego zamówienia.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <ChecklistItem key={item.id} orderId={orderId} item={item} />
      ))}
    </div>
  );
}
