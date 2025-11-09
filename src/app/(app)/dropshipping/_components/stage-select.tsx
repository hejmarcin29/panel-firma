"use client";

import { useState, useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DROPSHIPPING_STAGE_OPTIONS } from "@/lib/dropshipping/constants";

import { updateDropshippingStageAction } from "../actions";

interface StageSelectProps {
  orderId: number;
  currentStage: string;
}

export function StageSelect({ orderId, currentStage }: StageSelectProps) {
  const [value, setValue] = useState(currentStage);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={value}
        onValueChange={(nextValue) => {
          const previous = value;
          setValue(nextValue);
          setError(null);
          startTransition(async () => {
            const formData = new FormData();
            formData.append("orderId", String(orderId));
            formData.append("stage", nextValue);
            const result = await updateDropshippingStageAction(formData);
            if (result?.error) {
              setError(result.error);
              setValue(previous);
            }
          });
        }}
        disabled={pending}
      >
        <SelectTrigger className="rounded-2xl border-muted/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DROPSHIPPING_STAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {pending ? <p className="text-xs text-muted-foreground">Aktualizuję etap…</p> : null}
    </div>
  );
}
