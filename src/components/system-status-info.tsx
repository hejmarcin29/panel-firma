"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { pl } from "@/i18n/pl";

export function SystemStatusInfo() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => setInfoOpen(true)}>
        {pl.dashboard.systemInfoButton}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setEventOpen(true)}>
        {pl.dashboard.eventStoreButton}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setAutoOpen(true)}>
        {pl.dashboard.automationsButton}
      </Button>

      <AlertDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title={pl.dashboard.systemInfoTitle}
        description={
          <div className="space-y-3 text-left">
            <p>{pl.dashboard.systemInfoDescription}</p>
            <ul className="list-disc space-y-1 pl-5">
              {pl.dashboard.systemInfoPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        }
        cancelText={pl.common.close}
        showConfirmButton={false}
      />

      <AlertDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        title={pl.dashboard.eventStoreTitle}
        description={
          <div className="space-y-3 text-left">
            <p>{pl.dashboard.eventStoreDescription}</p>
            <div className="rounded border bg-muted/30 p-3 text-sm">
              {pl.dashboard.eventStoreEmpty}
            </div>
          </div>
        }
        cancelText={pl.common.close}
        showConfirmButton={false}
      />

      <AlertDialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
        title={pl.dashboard.automationsTitle}
        description={
          <div className="space-y-3 text-left">
            <p>{pl.dashboard.automationsDescription}</p>
            <div className="rounded border bg-muted/30 p-3 text-sm">
              {pl.dashboard.automationsEmpty}
            </div>
          </div>
        }
        cancelText={pl.common.close}
        showConfirmButton={false}
      />
    </div>
  );
}
